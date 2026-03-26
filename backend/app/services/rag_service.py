from rag.chat_rag import ask_llm

def chat_with_rag(question):

    answer = ask_llm(question)

    return answer