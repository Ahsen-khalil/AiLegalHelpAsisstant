# chat service with chroma
import os
import shutil
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings,ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter

load_dotenv()

# Load PDF
loaders = [
    PyPDFLoader("./data/Code_of_criminal_procedure_1898.pdf"),
    PyPDFLoader("./data/Constitution.pdf"),
    PyPDFLoader("./data/PPC.pdf")
]

pages = []

for loader in loaders:
    pages.extend(loader.load())

# Load the document, split it into chunks
text_splitter = CharacterTextSplitter(separator="\n",chunk_size=1000, chunk_overlap=0,length_function=len)
documents = text_splitter.split_documents(pages)

def load_chunks(docs):
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory="./chromadb",
        embedding_function=embeddings,
        collection_name="test_collection",
    )
    print("Adding documents to vectorstore")
    vectorstore.add_documents( docs)
    print("Documents added to vectorstore")

def get_retriver():
    embeddings = OpenAIEmbeddings(model='text-embedding-ada-002')
    
    # Initialize the vectorstore and load from the directory
    vectorstore = Chroma(
        persist_directory="./chromadb",  # Directory where the vectorstore is saved
        embedding_function=embeddings,   # Use OpenAI embeddings for document embedding
        collection_name="test_collection",  # Specify the collection name
    )
    
    # Return the retriever for similarity-based searches
    return vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 6})

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# load_chunks(documents)




LLM = ChatOpenAI(model='gpt-4o-mini')
retriver = get_retriver()
prompt = ChatPromptTemplate.from_template(
    """You are a lawyer. You will be given a context and a question. You have to answer the question based on the context given in the {data} don't answer irrelavnt questions , you can use previous knowledge from memory too.
    

    This is the question: {question}
    """
)
chain = ( 
    {"data": retriver | format_docs, "question": RunnablePassthrough()}
    | prompt 
    | LLM 
    | StrOutputParser())

# print(chain.invoke("what is constitution?"))


# response = chain.stream({"question": "dogs"})
# for r in response:
#     print(r, end="",flush=True)
