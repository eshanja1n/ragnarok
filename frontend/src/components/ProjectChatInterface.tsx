import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ArrowLeft, 
  ExternalLink, 
  Loader, 
  Plus, 
  MessageCircle,
  Menu,
  X
} from 'lucide-react';
import { 
  Project, 
  Chat, 
  Message, 
  getChats, 
  createChat, 
  getMessages, 
  queryRAG 
} from '../services/api';
import './ProjectChatInterface.css';

interface ProjectChatInterfaceProps {
  project: Project;
  onBackToProjects: () => void;
}

const ProjectChatInterface: React.FC<ProjectChatInterfaceProps> = ({ 
  project, 
  onBackToProjects 
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, [project.id]);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.id);
    }
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = async () => {
    try {
      const chatList = await getChats(project.id);
      setChats(chatList);
      if (chatList.length > 0 && !currentChat) {
        setCurrentChat(chatList[0]);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const messageList = await getMessages(chatId);
      setMessages(messageList);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const title = `Chat ${chats.length + 1}`;
      const newChat = await createChat(project.id, title);
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const switchChat = (chat: Chat) => {
    setCurrentChat(chat);
    setMessages([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading || !currentChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      sources: [],
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);

    try {
      const response = await queryRAG(currentChat.id, currentMessage);
      
      const assistantMessage: Message = {
        id: response.message_id,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update chat list order
      setChats(prev => [
        currentChat,
        ...prev.filter(c => c.id !== currentChat.id)
      ]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sources: [],
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatURL = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="project-chat-container">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="project-info">
            <h3>{project.name}</h3>
            <button onClick={onBackToProjects} className="back-to-projects-btn">
              <ArrowLeft size={16} />
              Back to Projects
            </button>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="close-sidebar-btn mobile-only"
          >
            <X size={20} />
          </button>
        </div>

        <button onClick={createNewChat} className="new-chat-btn">
          <Plus size={20} />
          New Chat
        </button>

        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${currentChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => switchChat(chat)}
            >
              <MessageCircle size={16} />
              <div className="chat-details">
                <span className="chat-title">{chat.title}</span>
                <span className="chat-time">{formatChatDate(chat.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-chat-area">
        <div className="chat-header">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="open-sidebar-btn"
          >
            <Menu size={20} />
          </button>
          <h1>{currentChat?.title || 'Select a chat'}</h1>
        </div>

        {currentChat ? (
          <>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <h2>Start chatting with {project.name}!</h2>
                  <p>Ask me anything about the documents in this project.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`message ${message.role}`}>
                    <div className="message-content">
                      <div className="message-text">
                        {message.content}
                      </div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="sources">
                          <h4>Sources:</h4>
                          <div className="source-list">
                            {message.sources.map((source, index) => (
                              <a
                                key={index}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-link"
                              >
                                <ExternalLink size={14} />
                                {formatURL(source)}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="message-time">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="message assistant loading">
                  <div className="message-content">
                    <div className="message-text">
                      <Loader className="spinner" size={20} />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-form">
              <div className="chat-input-container">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Ask me anything about your documents..."
                  className="chat-input"
                  rows={1}
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!currentMessage.trim() || loading}
                  className="send-btn"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <MessageCircle size={64} className="empty-icon" />
            <h3>No chat selected</h3>
            <p>Select a chat from the sidebar or create a new one to start chatting.</p>
          </div>
        )}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay mobile-only"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectChatInterface;