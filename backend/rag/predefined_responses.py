"""
Predefined responses for non-RAG intents.
These are returned immediately without going through the RAG pipeline.
"""

GREETING_RESPONSE = (
    "Hello! 👋 I'm your Legal AI Assistant. I can help with legal documents, "
    "constitutional rights, IPC, corporate law, and legal research. "
    "How can I assist you today?"
)

THANKS_RESPONSE = (
    "You're welcome! Feel free to ask any legal question."
)

BYE_RESPONSE = (
    "Goodbye! Have a great day. Feel free to return whenever you need legal assistance."
)

HELP_RESPONSE = (
    "I am a Legal RAG Assistant. I can answer questions about legal documents, laws, "
    "constitutional rights, corporate regulations, and other legal topics using "
    "retrieval-augmented generation."
)

RESPONSES = {
    "greeting": GREETING_RESPONSE,
    "thanks": THANKS_RESPONSE,
    "bye": BYE_RESPONSE,
    "help": HELP_RESPONSE,
}
