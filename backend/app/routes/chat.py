

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal, Optional

from rag.chat_rag import ask_llm

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    # NEW: optional mode field — defaults to "legal" so existing clients
    # that don't send this field continue to work exactly as before.
    mode: Optional[Literal["legal", "document"]] = "legal"


@router.post("/chat")
def chat(req: ChatRequest):

    if req.mode == "document":
        # ── NEW: Uploaded Document mode ──────────────────────────────────────
        from rag.document_upload_service import answer_from_uploaded_doc
        answer = answer_from_uploaded_doc(req.message)
    else:
        # ── EXISTING: Legal RAG mode (completely unchanged) ──────────────────
        answer = ask_llm(req.message)

    return {
        "answer": answer
    }
