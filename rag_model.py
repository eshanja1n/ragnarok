import re, os
import tiktoken
from dotenv import load_dotenv

from bs4 import BeautifulSoup

load_dotenv()

from langchain_community.document_loaders import RecursiveUrlLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_community.vectorstores import SKLearnVectorStore
from langchain_core.prompts import ChatPromptTemplate

class LangGraphRAG:
    def __init__(self, vectorstore_path=None):
        """
        Initialize the LangGraph RAG system.
        
        Args:
            vectorstore_path (str): Path to existing vectorstore, if None will create new one
        """
        self.vectorstore_path = vectorstore_path or os.path.join(os.getcwd(), "sklearn_vectorstore.parquet")
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        self.llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)
        self.vectorstore = None
        self.retriever = None
        
        # Create the prompt template for RAG
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful assistant that answers questions about LangGraph documentation. 
Use the provided context to answer the user's question accurately and comprehensively.

Context:
{context}

Instructions:
- Answer based primarily on the provided context
- If the context doesn't contain enough information, say so clearly
- Be specific and cite relevant details from the documentation
- If you're unsure, acknowledge the uncertainty"""),
            ("human", "{question}")
        ])
    
    def count_tokens(self, text, model="cl100k_base"):
        """Count the number of tokens in the text using tiktoken."""
        encoder = tiktoken.get_encoding(model)
        return len(encoder.encode(text))

    def bs4_extractor(self, html: str) -> str:
        """Extract text content from HTML using BeautifulSoup."""
        soup = BeautifulSoup(html, "lxml")
        
        # Target the main article content for LangGraph documentation 
        main_content = soup.find("article", class_="md-content__inner")
        
        # If found, use that, otherwise fall back to the whole document
        content = main_content.get_text() if main_content else soup.text
        
        # Clean up whitespace
        content = re.sub(r"\n\n+", "\n\n", content).strip()
        
        return content

    def load_documents_from_urls(self, urls):
        """Load documents from provided URLs."""
        print("Loading documents from provided URLs...")

        docs = []
        for url in urls:
            loader = RecursiveUrlLoader(
                url,
                max_depth=5,
                extractor=self.bs4_extractor,
            )

            # Load documents using lazy loading (memory efficient)
            docs_lazy = loader.lazy_load()

            # Load documents and track URLs
            for d in docs_lazy:
                docs.append(d)

        print(f"Loaded {len(docs)} documents from provided URLs.")
        print("\nLoaded URLs:")
        for i, doc in enumerate(docs):
            print(f"{i+1}. {doc.metadata.get('source', 'Unknown URL')}")
        
        # Count total tokens in documents
        total_tokens = 0
        tokens_per_doc = []
        for doc in docs:
            doc_tokens = self.count_tokens(doc.page_content)
            total_tokens += doc_tokens
            tokens_per_doc.append(doc_tokens)
        print(f"Total tokens in loaded documents: {total_tokens}")
        
        return docs, tokens_per_doc

    def load_langgraph_docs(self):
        """Load LangGraph documentation from the official website."""
        print("Loading LangGraph documentation...")

        # Load the documentation 
        urls = [
            "https://langchain-ai.github.io/langgraph/concepts/",
            "https://langchain-ai.github.io/langgraph/how-tos/",
            "https://langchain-ai.github.io/langgraph/tutorials/workflows/",  
            "https://langchain-ai.github.io/langgraph/tutorials/introduction/",
            "https://langchain-ai.github.io/langgraph/tutorials/langgraph-platform/local-server/",
        ] 

        docs = []
        for url in urls:
            loader = RecursiveUrlLoader(
                url,
                max_depth=5,
                extractor=self.bs4_extractor,
            )

            # Load documents using lazy loading (memory efficient)
            docs_lazy = loader.lazy_load()

            # Load documents and track URLs
            for d in docs_lazy:
                docs.append(d)

        print(f"Loaded {len(docs)} documents from LangGraph documentation.")
        print("\nLoaded URLs:")
        for i, doc in enumerate(docs):
            print(f"{i+1}. {doc.metadata.get('source', 'Unknown URL')}")
        
        # Count total tokens in documents
        total_tokens = 0
        tokens_per_doc = []
        for doc in docs:
            doc_tokens = self.count_tokens(doc.page_content)
            total_tokens += doc_tokens
            tokens_per_doc.append(doc_tokens)
        print(f"Total tokens in loaded documents: {total_tokens}")
        
        return docs, tokens_per_doc

    def save_docs_to_file(self, documents, filename="llms_full.txt"):
        """Save the documents to a file."""
        with open(filename, "w") as f:
            for i, doc in enumerate(documents):
                source = doc.metadata.get('source', 'Unknown URL')
                f.write(f"DOCUMENT {i+1}\n")
                f.write(f"SOURCE: {source}\n")
                f.write("CONTENT:\n")
                f.write(doc.page_content)
                f.write("\n\n" + "="*80 + "\n\n")

        print(f"Documents saved to {filename}")

    def split_documents(self, documents):
        """Split documents into smaller chunks for improved retrieval."""
        print("Splitting documents...")
        
        text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=8000,  
            chunk_overlap=500  
        )
        
        split_docs = text_splitter.split_documents(documents)
        
        print(f"Created {len(split_docs)} chunks from documents.")
        
        total_tokens = sum(self.count_tokens(doc.page_content) for doc in split_docs)
        print(f"Total tokens in split documents: {total_tokens}")
        
        return split_docs

    def create_vectorstore(self, splits):
        """Create a vector store from document chunks."""
        print("Creating SKLearnVectorStore...")
        
        vectorstore = SKLearnVectorStore.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_path=self.vectorstore_path,
            serializer="parquet",
        )
        print("SKLearnVectorStore created successfully.")
        
        vectorstore.persist()
        print(f"SKLearnVectorStore persisted to {self.vectorstore_path}")

        return vectorstore

    def load_vectorstore(self):
        """Load existing vectorstore from disk."""
        if os.path.exists(self.vectorstore_path):
            print(f"Loading existing vectorstore from {self.vectorstore_path}")
            self.vectorstore = SKLearnVectorStore(
                embedding=self.embeddings,
                persist_path=self.vectorstore_path,
                serializer="parquet"
            )
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
            return True
        else:
            print(f"Vectorstore not found at {self.vectorstore_path}")
            return False

    def setup_rag_system(self, urls=None, force_rebuild=False):
        """Set up the complete RAG system."""
        if not force_rebuild and self.load_vectorstore():
            print("Using existing vectorstore.")
            return
        
        print("Building new vectorstore...")
        # Load documents
        if urls:
            documents, _ = self.load_documents_from_urls(urls)
        else:
            documents, _ = self.load_langgraph_docs()
        
        # Save documents to file (optional)
        self.save_docs_to_file(documents)
        
        # Split documents
        split_docs = self.split_documents(documents)
        
        # Create vectorstore
        self.vectorstore = self.create_vectorstore(split_docs)
        self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})

    def retrieve_context(self, query: str) -> str:
        """Retrieve relevant context for a query."""
        if not self.retriever:
            raise ValueError("RAG system not initialized. Call setup_rag_system() first.")
        
        relevant_docs = self.retriever.invoke(query)
        print(f"Retrieved {len(relevant_docs)} relevant documents")
        
        # Format context from retrieved documents
        formatted_context = "\n\n".join([
            f"==DOCUMENT {i+1}==\nSource: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" 
            for i, doc in enumerate(relevant_docs)
        ])
        
        return formatted_context

    def query(self, question: str) -> str:
        """
        Query the RAG system and get an answer.
        
        Args:
            question (str): The question to ask about LangGraph
            
        Returns:
            str: The answer based on the retrieved context
        """
        if not self.retriever:
            raise ValueError("RAG system not initialized. Call setup_rag_system() first.")
        
        # Retrieve relevant context
        context = self.retrieve_context(question)
        
        # Generate response using the LLM
        messages = self.prompt_template.format_messages(
            context=context,
            question=question
        )
        
        response = self.llm.invoke(messages)
        return response.content


def main():
    """Interactive RAG system that accepts user input for URLs and queries."""
    print("Welcome to the RAG System!")
    print("=" * 50)
    
    # Get URLs from user
    print("\nEnter the URLs you want to use as documents (one per line).")
    print("Press Enter twice when done, or type 'default' to use LangGraph docs:")
    
    urls = []
    while True:
        url = input("URL: ").strip()
        if url == "":
            break
        elif url.lower() == "default":
            urls = None
            break
        else:
            urls.append(url)
    
    # Initialize the RAG system
    rag_system = LangGraphRAG()
    
    # Set up the system with user-provided URLs or default
    if urls:
        print(f"\nSetting up RAG system with {len(urls)} URLs...")
        rag_system.setup_rag_system(urls=urls)
    else:
        print("\nSetting up RAG system with default LangGraph documentation...")
        rag_system.setup_rag_system()
    
    print("\n" + "="*50)
    print("RAG System Ready - Enter your queries")
    print("Type 'quit' to exit")
    print("="*50)
    
    # Interactive query loop
    while True:
        query = input("\nEnter your question: ").strip()
        
        if query.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if not query:
            print("Please enter a question.")
            continue
        
        print("\nProcessing your question...")
        print("-" * 30)
        
        try:
            answer = rag_system.query(query)
            print(f"\nAnswer: {answer}")
        except Exception as e:
            print(f"Error: {e}")
        
        print("\n" + "="*50)


if __name__ == "__main__":
    main()