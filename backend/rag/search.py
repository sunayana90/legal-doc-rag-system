from langchain_community.vectorstores import Chroma

from rag.embeddings import get_embeddings


DB_PATH = "vector_store"


def get_vector_db():

    embeddings = get_embeddings()

    vectordb = Chroma(
        persist_directory=DB_PATH,
        embedding_function=embeddings,
    )

    return vectordb


def search_docs(query, k=3):

    vectordb = get_vector_db()

    results = vectordb.similarity_search(
        query,
        k=k,
    )

    return results


if __name__ == "__main__":

    query = "What is fundamental rights in India?"

    docs = search_docs(query)

    print("Results:\n")

    for d in docs:
        print(d.page_content)
        print("------")