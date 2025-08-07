from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
import uvicorn
import os
from datetime import datetime
from rag_model import LangGraphRAG
from models import create_tables, get_db, Project, Chat, Message

app = FastAPI(title="RAG API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
create_tables()

# Global RAG systems dict (project_id -> RAG instance)
rag_systems: Dict[str, LangGraphRAG] = {}

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    urls: List[str]

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    urls: List[str]
    created_at: datetime
    updated_at: datetime

class ChatCreate(BaseModel):
    project_id: str
    title: str

class ChatResponse(BaseModel):
    id: str
    project_id: str
    title: str
    created_at: datetime
    updated_at: datetime

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: List[str]
    created_at: datetime

class QueryRequest(BaseModel):
    chat_id: str
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    message_id: str

# Project endpoints
@app.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new RAG project"""
    try:
        # Create vectorstore path
        vectorstore_path = f"projects/{project.name.replace(' ', '_').lower()}_vectorstore.parquet"
        os.makedirs("projects", exist_ok=True)
        
        # Create database record
        db_project = Project(
            name=project.name,
            description=project.description,
            urls=project.urls,
            vectorstore_path=vectorstore_path
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        
        # Initialize RAG system
        rag_system = LangGraphRAG(vectorstore_path=vectorstore_path)
        if project.urls:
            rag_system.setup_rag_system(urls=project.urls, force_rebuild=True)
        else:
            rag_system.setup_rag_system(force_rebuild=True)
        
        # Store RAG system
        rag_systems[db_project.id] = rag_system
        
        return ProjectResponse(
            id=db_project.id,
            name=db_project.name,
            description=db_project.description,
            urls=db_project.urls,
            created_at=db_project.created_at,
            updated_at=db_project.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects", response_model=List[ProjectResponse])
async def get_projects(db: Session = Depends(get_db)):
    """Get all projects"""
    projects = db.query(Project).all()
    return [ProjectResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        urls=p.urls,
        created_at=p.created_at,
        updated_at=p.updated_at
    ) for p in projects]

@app.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get a specific project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Load RAG system if not already loaded
    if project_id not in rag_systems and os.path.exists(project.vectorstore_path):
        rag_system = LangGraphRAG(vectorstore_path=project.vectorstore_path)
        rag_system.load_vectorstore()
        rag_systems[project_id] = rag_system
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        urls=project.urls,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

# Chat endpoints
@app.post("/chats", response_model=ChatResponse)
async def create_chat(chat: ChatCreate, db: Session = Depends(get_db)):
    """Create a new chat in a project"""
    project = db.query(Project).filter(Project.id == chat.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_chat = Chat(
        project_id=chat.project_id,
        title=chat.title
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    
    return ChatResponse(
        id=db_chat.id,
        project_id=db_chat.project_id,
        title=db_chat.title,
        created_at=db_chat.created_at,
        updated_at=db_chat.updated_at
    )

@app.get("/projects/{project_id}/chats", response_model=List[ChatResponse])
async def get_chats(project_id: str, db: Session = Depends(get_db)):
    """Get all chats for a project"""
    chats = db.query(Chat).filter(Chat.project_id == project_id).order_by(Chat.updated_at.desc()).all()
    return [ChatResponse(
        id=c.id,
        project_id=c.project_id,
        title=c.title,
        created_at=c.created_at,
        updated_at=c.updated_at
    ) for c in chats]

@app.get("/chats/{chat_id}/messages", response_model=List[MessageResponse])
async def get_messages(chat_id: str, db: Session = Depends(get_db)):
    """Get all messages in a chat"""
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at).all()
    return [MessageResponse(
        id=m.id,
        role=m.role,
        content=m.content,
        sources=m.sources or [],
        created_at=m.created_at
    ) for m in messages]

@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest, db: Session = Depends(get_db)):
    """Query the RAG system and save to chat"""
    # Get chat and project
    chat = db.query(Chat).filter(Chat.id == request.chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    project = db.query(Project).filter(Project.id == chat.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get RAG system
    if chat.project_id not in rag_systems:
        if not os.path.exists(project.vectorstore_path):
            raise HTTPException(status_code=400, detail="Project RAG system not initialized")
        rag_system = LangGraphRAG(vectorstore_path=project.vectorstore_path)
        rag_system.load_vectorstore()
        rag_systems[chat.project_id] = rag_system
    
    rag_system = rag_systems[chat.project_id]
    
    try:
        # Save user message
        user_message = Message(
            chat_id=request.chat_id,
            role="user",
            content=request.question
        )
        db.add(user_message)
        
        # Get answer from RAG
        answer = rag_system.query(request.question)
        relevant_docs = rag_system.retriever.invoke(request.question)
        sources = [doc.metadata.get('source', 'Unknown') for doc in relevant_docs]
        
        # Save assistant message
        assistant_message = Message(
            chat_id=request.chat_id,
            role="assistant",
            content=answer,
            sources=sources
        )
        db.add(assistant_message)
        
        # Update chat timestamp
        chat.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assistant_message)
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            message_id=assistant_message.id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "loaded_projects": len(rag_systems)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)