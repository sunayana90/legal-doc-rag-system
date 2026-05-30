import os
from typing import Optional
from dotenv import load_dotenv

from groq import Groq
from rag.search import search_docs
from rag.prompt_loader import load_prompt
from rag.mode_router import detect_mode
from rag.intent_router import detect_intent
from rag.predefined_responses import RESPONSES

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(
    api_key=API_KEY
)


def ask_llm(question: str, mode: Optional[str] = "legal") -> str:
    """
    Hybrid chatbot that handles both predefined intents and RAG queries.
    
    Args:
        question: User input message
        mode: Document category mode (legal, corporate, rights)
        
    Returns:
        Response string from predefined responses or RAG pipeline
    """
    # Step 1: Detect user intent
    intent = detect_intent(question)
    
    # Step 2: If intent is non-legal, return predefined response
    if intent in RESPONSES:
        return RESPONSES[intent]
    
    # Step 3: Intent is "legal" - process through RAG pipeline
    mode = detect_mode(question)

    docs = search_docs(question, k=3)

    context = "\n\n".join(
        [
            f"Source: {d.metadata.get('source')} Page: {d.metadata.get('page')}\n{d.page_content}"
            for d in docs
        ]
    )

    template = load_prompt(mode)

    prompt = template.format(
        context=context,
        question=question
    )

    chat = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ],
    )

    return chat.choices[0].message.content

if __name__ == "__main__":

    while True:

        q = input("Ask: ")

        mode = detect_mode(q)

        ans = ask_llm(q, mode)

        print("\nAnswer:\n", ans)