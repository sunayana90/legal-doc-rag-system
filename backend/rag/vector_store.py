from langchain_community.vectorstores import Chroma

from rag.embeddings import get_embeddings
from rag.chunk_docs import split_docs


DB_PATH = "vector_store"


def create_vector_store():

    print("Loading chunks...")

    chunks = split_docs()

    print("Loading embeddings model...")

    embeddings = get_embeddings()

    print("Creating vector DB...")

    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=DB_PATH,
    )

    vectordb.persist()

    print("Vector DB created")


if __name__ == "__main__":

    create_vector_store()