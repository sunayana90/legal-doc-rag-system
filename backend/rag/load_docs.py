# used to read folder, files, paths
import os
# this converts PDF → text
from langchain_community.document_loaders import PyPDFLoader

DATA_PATH = "data"

# this function reads all the PDFs in the data folder and converts them to text documents
def load_all_pdfs():
    # Create empty list to store the documents
    documents = []
    # Loop over files in the data folder
    for file in os.listdir(DATA_PATH):
        # Only read PDF
        if file.endswith(".pdf"):
            # Get the full path to the PDF file
            path = os.path.join(DATA_PATH, file)
            # Create a PyPDFLoader for the file
            loader = PyPDFLoader(path)
            # Load the PDF and convert it to text documents
            docs = loader.load()
            # Add the documents to the list
            documents.extend(docs)
    # Return the list of documents
    return documents


if __name__ == "__main__":
    # Call function to load all PDFs and convert them to text documents
    docs = load_all_pdfs()
    # Shows number of pages loaded.
    print("Loaded docs:", len(docs))