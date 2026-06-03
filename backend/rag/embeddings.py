# from langchain_huggingface import HuggingFaceEmbeddings

# def get_embeddings():

#     embeddings = HuggingFaceEmbeddings(
#         model_name="sentence-transformers/all-MiniLM-L6-v2"
#     )

#     return embeddings


# if __name__ == "__main__":

#     emb = get_embeddings()

#     print("Embedding model loaded")


#---------------------------------------------------------------------------

from langchain_huggingface import HuggingFaceEmbeddings

def get_embeddings():

    embeddings = HuggingFaceEmbeddings(
        model_name="intfloat/multilingual-e5-base"
    )

    return embeddings


if __name__ == "__main__":

    emb = get_embeddings()

    print("Embedding model loaded")