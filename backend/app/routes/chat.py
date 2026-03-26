from fastapi import APIRouter
from pydantic import BaseModel

from rag.chat_rag import ask_llm

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
def chat(req: ChatRequest):

    answer = ask_llm(req.message)

    return {
        "answer": answer
    }