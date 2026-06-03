# # This splits text.
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# # Uses previous file.
# from rag.chunk_docs import split_docs


# def split_docs():

#     # load all pdf text
#     docs = load_all_pdfs()

#     # create splitter
#     splitter = RecursiveCharacterTextSplitter(
#         chunk_size=500,
#         chunk_overlap=100
#     )

#     # split documents into chunks
#     chunks = splitter.split_documents(docs)

#     return chunks


# if __name__ == "__main__":

#     chunks = split_docs()

#     print("Total chunks:", len(chunks))


#---------------------------------------------------------

# This splits text.
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Uses previous file.
from rag.load_docs import load_all_pdfs


def split_docs():

    # load all pdf text
    docs = load_all_pdfs()

    # create splitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    # split documents into chunks
    chunks = splitter.split_documents(docs)

    return chunks


if __name__ == "__main__":

    chunks = split_docs()

    print("Total chunks:", len(chunks))