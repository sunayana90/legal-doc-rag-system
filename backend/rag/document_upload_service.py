import os
import io
import uuid
import tempfile
from typing import Optional

# ── Text extraction ────────────────────────────────────────────────────────────
def _extract_pdf(file_bytes: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def _extract_docx(file_bytes: bytes) -> str:
    try:
        import docx
    except ImportError:
        raise ImportError(
            "python-docx is required for DOCX support. "
            "Run: pip install python-docx"
        )
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        doc = docx.Document(tmp_path)
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    finally:
        os.unlink(tmp_path)


def _extract_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Dispatch to the right extractor based on file extension."""
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return _extract_pdf(file_bytes)
    elif ext == ".docx":
        return _extract_docx(file_bytes)
    elif ext == ".txt":
        return _extract_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


# ── Chunking ───────────────────────────────────────────────────────────────────
def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    """
    Simple word-based chunking.  Tries to import your existing chunk_docs
    logic first; falls back to a local implementation so nothing breaks if
    the signature differs.
    """
    try:
        # Attempt to reuse your existing chunker
        from rag.chunk_docs import chunk_text as existing_chunker  # type: ignore
        return existing_chunker(text)
    except Exception:
        pass

    # Fallback: plain character-window chunking
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end].strip())
        start += chunk_size - overlap
    return [c for c in chunks if c]


# ── Session-scoped vector store ────────────────────────────────────────────────
# One ephemeral Chroma client per Python process, using an in-memory DB.
# Each upload call replaces the collection for that session_id.

import chromadb

_chroma_client: Optional[chromadb.EphemeralClient] = None  # type: ignore


def _get_chroma_client() -> chromadb.EphemeralClient:  # type: ignore
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.EphemeralClient()
    return _chroma_client


# Collection name for the uploaded doc (one per app instance — one doc per session)
_UPLOAD_COLLECTION = "uploaded_document"


def process_and_store(file_bytes: bytes, filename: str) -> dict:
    """
    Full pipeline:
      1. Extract text
      2. Chunk
      3. Embed
      4. Store in a SEPARATE ephemeral Chroma collection

    Returns metadata dict for the API response.
    """
    # 1. Extract
    text = extract_text(file_bytes, filename)
    if not text.strip():
        raise ValueError("No readable text found in the uploaded document.")

    # 2. Chunk
    chunks = _chunk_text(text)

    # 3. Embeddings — reuse your existing embedding function
    try:
        from rag.embeddings import get_embeddings  # type: ignore
        embed_fn = get_embeddings()
        # LangChain embedding objects expose .embed_documents()
        embeddings = embed_fn.embed_documents(chunks)
    except Exception as e:
        raise RuntimeError(f"Embedding failed: {e}")

    # 4. Store in separate ephemeral collection
    client = _get_chroma_client()

    # Delete old collection if it exists (replace previous upload)
    try:
        client.delete_collection(_UPLOAD_COLLECTION)
    except Exception:
        pass

    collection = client.create_collection(
        name=_UPLOAD_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [str(uuid.uuid4()) for _ in chunks]
    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{"source": filename, "chunk_index": i} for i, _ in enumerate(chunks)],
    )

    return {
        "filename": filename,
        "chunks": len(chunks),
        "characters": len(text),
    }


# ── Retrieval ──────────────────────────────────────────────────────────────────

def retrieve_from_uploaded_doc(query: str, k: int = 5) -> list[str]:
    """
    Retrieve the top-k relevant chunks from the uploaded document collection.
    Returns an empty list if no document has been uploaded yet.
    """
    client = _get_chroma_client()

    try:
        collection = client.get_collection(_UPLOAD_COLLECTION)
    except Exception:
        return []  # No document uploaded yet

    # Embed the query using the same embedding function
    from rag.embeddings import get_embeddings  # type: ignore
    embed_fn = get_embeddings()
    query_embedding = embed_fn.embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(k, collection.count()),
        include=["documents"],
    )

    docs = results.get("documents", [[]])[0]
    return docs


# ── Answer generation ──────────────────────────────────────────────────────────

def answer_from_uploaded_doc(question: str) -> str:
    """
    RAG answer strictly from the uploaded document.
    Falls back to a clear 'not found' message — no hallucination.
    """
    chunks = retrieve_from_uploaded_doc(question)

    if not chunks:
        return (
            "No document has been uploaded yet. "
            "Please upload a document first using the upload button."
        )

    context = "\n\n---\n\n".join(chunks)

    # Build a strict prompt
    prompt = f"""
You are a professional document analysis assistant.

Answer ONLY using the provided document context.

Rules:
1. Give a clean and structured answer.
2. Use headings and bullet points when appropriate.
3. Explain legal terms in simple language.
4. Do not copy raw chunks unless necessary.
5. If the answer is not found, say:
   "I could not find this information in the uploaded document."

Document Context:
{context}

Question:
{question}

Answer:
"""

    # Reuse your existing Groq/LLM client
    try:
        from rag.chat_rag import ask_llm_with_context  # type: ignore
        return ask_llm_with_context(prompt)
    except ImportError:
        pass

    # Fallback: call Groq directly
    try:
        from services.groq_client import get_groq_client  # type: ignore
        client = get_groq_client()
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        pass

    # Last resort: call Groq via env var directly
    import os
    from groq import Groq  # type: ignore
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = groq_client.chat.completions.create(
       model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()
