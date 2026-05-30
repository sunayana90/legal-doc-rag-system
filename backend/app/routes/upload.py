
from fastapi import APIRouter, UploadFile, File, HTTPException

from rag.document_upload_service import process_and_store

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF / DOCX / TXT).
    Extracts text → chunks → embeds → stores in a session-scoped
    ephemeral vector store completely separate from the legal KB.
    """
    import os

    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, DOCX, TXT.",
        )

    # Read file bytes
    file_bytes = await file.read()

    # Guard file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum allowed size is 20 MB.",
        )

    # Process
    try:
        meta = process_and_store(file_bytes, file.filename or "document")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "ready",
        "filename": meta["filename"],
        "chunks": meta["chunks"],
        "characters": meta["characters"],
        "message": f"Document '{meta['filename']}' processed successfully. "
                   f"Ready to answer questions.",
    }
