# ragnarok

A comprehensive web-based Retrieval-Augmented Generation (RAG) system that allows users to create multiple projects, manage chat conversations, and interact with their documents. 

## 🌟 Key Features

### **Project Management**
- **Multiple Projects**: Create RAG projects with different knowledge bases
- **Project Organization**: Each project has its own vectorstore and document sources
- **Project Overview**: Visual dashboard showing all your projects with source counts and dates

### **Chat Management**
- **Multiple Chats per Project**: Create unlimited conversations within each project
- **Persistent Chat History**: All conversations are saved and can be resumed anytime
- **Chat Switching**: Easily switch between different conversations
- **Real-time Updates**: Chat list updates automatically with latest activity

### **Document Processing**
- **URL Input Interface**: Add multiple URLs to create your knowledge base
- **Interactive Chat**: Chat style interface with source citations
- **Real-time Processing**: Built with FastAPI backend and React frontend
- **Source Attribution**: Shows sources for each answer with clickable links

## 🏗️ Project Structure

```
├── backend.py                    # FastAPI backend server with project/chat APIs
├── models.py                     # SQLAlchemy database models
├── rag_model.py                 # Core RAG functionality
├── requirements.txt             # Python dependencies
├── start.py                     # Startup script
├── rag_app.db                   # SQLite database (auto-created)
├── projects/                    # Project vectorstores directory (auto-created)
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProjectList.tsx            # Project management dashboard
│   │   │   ├── CreateProject.tsx          # New project creation
│   │   │   ├── ProjectChatInterface.tsx   # Main chat interface with sidebar
│   │   │   ├── ProjectList.css            # Project dashboard styles
│   │   │   ├── CreateProject.css          # Project creation styles
│   │   │   └── ProjectChatInterface.css   # Chat interface styles
│   │   ├── services/
│   │   │   └── api.ts                     # Complete API service layer
│   │   ├── App.tsx                        # Main app with routing logic
│   │   └── App.css                        # Global styles
│   └── package.json
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key
- Anthropic API key

### Environment Setup

1. **Clone and navigate to the project**:
   ```bash
   cd ragnarok
   ```

2. **Create a Python virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

5. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Running the Application

### Option 1: Using the startup script (Recommended)
```bash
python start.py
```
This will start both the backend (http://localhost:8000) and frontend (http://localhost:3000) automatically.

### Option 2: Manual startup
Start the backend and frontend in separate terminals:

**Terminal 1 - Backend**:
```bash
python backend.py
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm start
```

## 🚀 Usage Guide

### **Getting Started**
1. **Open your browser** to http://localhost:3000
2. **Create your first project**: Click "New Project" or "Create Your First Project"
3. **Set up project details**:
   - Enter a project name (required)
   - Add an optional description
   - Add URLs for your knowledge base, or use "Create with Default Docs"
4. **Wait for processing**: The system will crawl and process the documents
5. **Start chatting**: Your project dashboard will open with a new chat ready

### **Managing Projects**
- **View all projects**: The main dashboard shows all your RAG projects
- **Create new projects**: Click the "New Project" button anytime
- **Access projects**: Click on any project card to enter the chat interface
- **Project info**: Each card shows source count, description, and creation date

### **Managing Chats**
- **Create new chats**: Click "New Chat" in the sidebar for fresh conversations
- **Switch chats**: Click on any chat in the sidebar to resume that conversation
- **Chat history**: All messages are automatically saved and persist between sessions
- **Recent activity**: Chats are ordered by most recent activity

### **Chatting with Your Documents**
- **Ask questions**: Type in the message box and press Enter or click Send
- **View sources**: Each answer includes clickable source links
- **Conversation flow**: Chat naturally - the system maintains context
- **Multi-line messages**: Shift+Enter for new lines, Enter to send

## 🛠️ API Endpoints

### **Project Management**
- `GET /projects` - Get all projects
- `POST /projects` - Create a new project
- `GET /projects/{project_id}` - Get specific project details

### **Chat Management**
- `GET /projects/{project_id}/chats` - Get all chats for a project
- `POST /chats` - Create a new chat
- `GET /chats/{chat_id}/messages` - Get chat message history

### **RAG Operations**
- `POST /query` - Query the RAG system (requires chat_id)
- `GET /health` - Health check and system status

## 🧰 Technologies Used

**Backend**:
- **FastAPI** - Modern, fast web framework with automatic API docs
- **SQLAlchemy** - SQL toolkit and ORM for database management
- **SQLite** - Lightweight database for storing projects, chats, and messages
- **LangChain** - RAG implementation framework
- **OpenAI** - Text embeddings generation
- **Anthropic Claude** - Language model for responses
- **BeautifulSoup** - Web scraping and content extraction

**Frontend**:
- **React with TypeScript** - Modern UI framework with type safety
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API communication
- **CSS3** - Custom responsive styling

## 🔧 Development Features

- **FastAPI Auto Docs**: Visit http://localhost:8000/docs for interactive API documentation
- **Hot Reload**: Both backend and frontend support live reloading during development
- **Type Safety**: Full TypeScript support for better development experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Database Migrations**: Automatic database table creation on first run

## 📋 Database Schema

The application uses SQLite with three main tables:

- **Projects**: Store project metadata, URLs, and vectorstore paths
- **Chats**: Individual conversations within projects
- **Messages**: User and assistant messages with sources

## 🗂️ Data Persistence

- **Project Vectorstores**: Each project gets its own vectorstore file in `projects/` directory
- **Chat History**: All conversations are permanently stored in the database
- **Project Settings**: URLs and configurations are saved per project
- **Automatic Cleanup**: Vectorstore loading is optimized to save memory

## 🚀 Production Considerations

- Database can be easily switched from SQLite to PostgreSQL for production
- Vectorstores are stored locally but can be moved to cloud storage
- API supports horizontal scaling with multiple instances
- Frontend builds to static files for CDN deployment

## 🎯 Key Benefits

1. **Multi-Project Support**: Organize different knowledge bases separately
2. **Persistent Conversations**: Never lose your chat history
3. **Scalable Architecture**: Built to handle multiple users and projects
4. **Modern UI/UX**: Intuitive interface similar to popular AI chat tools
5. **Source Transparency**: Always see where answers come from
6. **Flexible Document Sources**: Support for any web-accessible content