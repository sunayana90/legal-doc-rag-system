# ⚖️ Legal RAG AI — Intelligent Legal Research Assistant

> AI-powered legal research chatbot built with Retrieval-Augmented Generation (RAG). Ask questions about Indian law or upload your own documents for instant, grounded answers.

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14%2B-000000?style=flat-square&logo=next.js&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6B35?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## <img width="1920" height="926" alt="image" src="https://github.com/user-attachments/assets/935734d1-a246-44ed-a4b0-e3713b64b530" />

---

## ✨ Features

### 🏛️ Legal Knowledge Base (RAG)
- Pre-loaded with **10 Indian legal documents** including IPC, CrPC, Constitution, Consumer Law, IT & Cyber Laws, Labour Act, Hindu Marriage Act, Company Law, Human Rights, and Rights documents
- Semantic vector search using **sentence-transformers embeddings**
- Answers grounded strictly in legal source material — no hallucination
- Intelligent **intent routing** to pick the right legal domain
- **Multilingual support** via language detection
- **Predefined responses** for common legal queries

### 📄 Document Upload & Chat
- Upload your own **PDF, DOCX, or TXT** documents (up to 20 MB)
- Ask questions about uploaded contracts, agreements, or any document
- Completely **isolated vector store** — never touches the legal KB
- Drag-and-drop upload with real-time progress indicator
- Strict hallucination control: responds with *"I could not find this information in the uploaded document"* when content isn't present

### 🎙️ Voice Features
- **Speech-to-text** input via OpenAI Whisper
- **Text-to-speech** responses via gTTS

### 💬 Chat Interface
- Clean, minimal Next.js frontend with session history
- Markdown rendering (tables, code blocks, lists, headings)
- Multi-session chat with persistent history within the session
- Mode toggle: **Legal Knowledge Base** ↔ **Uploaded Document**
- Real-time backend health indicator
- Typing animation indicator
- Keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline)

---

## 🗂️ Project Structure

```
legal-rag-chatbot/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   └── settings.py          # App configuration & env vars
│   │   ├── database/
│   │   │   ├── db.py                # Database connection
│   │   │   ├── models.py            # SQLAlchemy models
│   │   │   └── schemas.py           # Pydantic schemas
│   │   ├── routes/
│   │   │   ├── auth.py              # Authentication routes
│   │   │   ├── chat.py              # POST /chat — main chat endpoint
│   │   │   ├── upload.py            # POST /upload-document
│   │   │   └── voice.py             # Voice routes (STT / TTS)
│   │   ├── services/
│   │   │   ├── groq_client.py       # Groq LLM client
│   │   │   ├── language_detect.py   # Language detection
│   │   │   ├── rag_service.py       # RAG orchestration service
│   │   │   ├── speech_to_text.py    # Whisper STT
│   │   │   └── text_to_speech.py    # gTTS TTS
│   │   └── main.py                  # FastAPI app entry point
│   ├── data/                        # Legal PDF knowledge base
│   │   ├── 11_IT_and_Cyber_Laws.pdf
│   │   ├── CompanyLaw_BOOK.pdf
│   │   ├── consitution.pdf
│   │   ├── Consumer Law.pdf
│   │   ├── CrPC.pdf
│   │   ├── H-2537 Human Rights in.pdf
│   │   ├── Hindu-marraige.pdf
│   │   ├── ipc.pdf
│   │   ├── Labour Act.pdf
│   │   └── Rights.pdf
│   ├── prompts/                     # Domain-specific system prompts
│   │   ├── corporate_prompt.txt
│   │   ├── legal_prompt.txt
│   │   ├── rights_prompt.txt
│   │   └── voice_prompt.txt
│   ├── rag/                         # Core RAG components
│   │   ├── chat_rag.py              # Main ask_llm() function
│   │   ├── chunk_docs.py            # Text chunking logic
│   │   ├── document_upload_service.py  # Uploaded doc processing
│   │   ├── embeddings.py            # Embedding model setup
│   │   ├── intent_router.py         # Query intent classification
│   │   ├── load_docs.py             # PDF loader for legal KB
│   │   ├── mode_router.py           # Chat mode routing
│   │   ├── predefined_responses.py  # Static response library
│   │   ├── prompt_loader.py         # Dynamic prompt loading
│   │   ├── search.py                # Vector similarity search
│   │   └── vector_store.py          # ChromaDB vector store (legal KB)
│   ├── vector_store/                # Persisted Chroma DB (legal KB)
│   ├── .env                         # Environment variables
│   └── requirements.txt
└── frontend/
    └── next/
        ├── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx             # Main chat UI
        ├── package.json
        ├── tailwind.config.ts
        └── next.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free tier available)

### 1. Clone the repository

```bash
git clone https://github.com/sunayana90/legal-doc-rag-system.git
cd legal-rag-chatbot
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> Get your free Groq API key at [console.groq.com](https://console.groq.com)

### 4. Build the Vector Store

The legal knowledge base must be indexed before first use:

```bash
# From the backend/ directory
python -c "from rag.load_docs import load_and_index; load_and_index()"
```

> This reads all PDFs from `data/`, chunks them, generates embeddings, and persists them to `vector_store/`. Run once — subsequent starts reuse the saved index.

### 5. Start the Backend

```bash
# From the backend/ directory
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend runs at: `http://127.0.0.1:8000`

### 6. Frontend Setup

```bash
cd frontend/next

npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔌 API Reference

### `POST /chat`

Send a message to the chatbot.

**Request body:**
```json
{
  "message": "What does Section 302 of IPC say?",
  "mode": "legal"
}
```

| Field | Type | Required | Values | Default |
|-------|------|----------|--------|---------|
| `message` | string | ✅ | Any text | — |
| `mode` | string | ❌ | `"legal"` \| `"document"` | `"legal"` |

**Response:**
```json
{
  "answer": "Section 302 of the Indian Penal Code deals with punishment for murder..."
}
```

---

### `POST /upload-document`

Upload a document for the "Uploaded Document" chat mode.

**Request:** `multipart/form-data` with field `file`

**Supported formats:** `.pdf`, `.docx`, `.txt` (max 20 MB)

**Response:**
```json
{
  "status": "ready",
  "filename": "contract.pdf",
  "chunks": 42,
  "characters": 18500,
  "message": "Document 'contract.pdf' processed successfully. Ready to answer questions."
}
```

**Error responses:**
| Status | Reason |
|--------|--------|
| `400` | Unsupported file type |
| `413` | File exceeds 20 MB |
| `422` | No readable text found in document |
| `500` | Embedding or processing failure |

---

## 🧠 Architecture

```
User Query
    │
    ▼
┌─────────────┐
│  mode field │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
Legal KB  Uploaded Doc
  Mode      Mode
  │         │
  ▼         ▼
Intent    Ephemeral
Router    ChromaDB
  │       (session)
  ▼         │
Domain    Top-K
Prompt    Chunks
  │         │
  └────┬────┘
       │
       ▼
  Groq LLM
  (llama3-8b)
       │
       ▼
   Answer
```

### Legal KB Mode
1. Query hits `ask_llm()` in `chat_rag.py`
2. **Intent router** classifies the query domain (criminal, corporate, rights, etc.)
3. Domain-specific **prompt** is loaded from `prompts/`
4. **Vector search** retrieves top-k chunks from the persisted ChromaDB
5. Groq LLM generates an answer grounded in retrieved context

### Uploaded Document Mode
1. File is uploaded via `POST /upload-document`
2. Text is extracted (PDF → pypdf, DOCX → python-docx, TXT → decode)
3. Text is chunked using the same logic as the legal KB
4. Embeddings generated with the same model, stored in an **ephemeral** ChromaDB collection
5. On each query, top-k chunks retrieved and passed to Groq with a strict "answer only from context" prompt
6. Uploading a new document replaces the previous one

---

## 📚 Legal Knowledge Base

The following Indian legal texts are pre-indexed:

| Document | Domain |
|----------|--------|
| Indian Penal Code (IPC) | Criminal Law |
| Code of Criminal Procedure (CrPC) | Criminal Procedure |
| Constitution of India | Constitutional Law |
| Consumer Protection Act | Consumer Rights |
| IT & Cyber Laws | Technology Law |
| Company Law | Corporate Law |
| Hindu Marriage Act | Family Law |
| Labour Act | Employment Law |
| Human Rights | Human Rights |
| Rights Documents | Fundamental Rights |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | Groq (LLaMA 3 8B) |
| **Embeddings** | sentence-transformers (HuggingFace) |
| **Vector Store** | ChromaDB |
| **RAG Framework** | LangChain |
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | Next.js 14 + TypeScript |
| **Styling** | Tailwind CSS |
| **PDF Parsing** | pypdf |
| **DOCX Parsing** | python-docx |
| **Speech-to-Text** | OpenAI Whisper |
| **Text-to-Speech** | gTTS |
| **Language Detection** | langdetect |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please make sure existing tests pass and the legal KB functionality remains intact.

---

## ⚠️ Disclaimer

This tool is intended for **informational and research purposes only**. It does not constitute legal advice. Always consult a qualified legal professional for matters requiring legal counsel.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ for accessible legal information
</div>
