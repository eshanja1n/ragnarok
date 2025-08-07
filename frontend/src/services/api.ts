import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Project {
  id: string;
  name: string;
  description?: string;
  urls: string[];
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: string[];
  created_at: string;
}

export interface QueryResponse {
  answer: string;
  sources: string[];
  message_id: string;
}

// Project APIs
export const createProject = async (name: string, description: string, urls: string[]): Promise<Project> => {
  const response = await api.post('/projects', { name, description, urls });
  return response.data;
};

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProject = async (projectId: string): Promise<Project> => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

// Chat APIs
export const createChat = async (projectId: string, title: string): Promise<Chat> => {
  const response = await api.post('/chats', { project_id: projectId, title });
  return response.data;
};

export const getChats = async (projectId: string): Promise<Chat[]> => {
  const response = await api.get(`/projects/${projectId}/chats`);
  return response.data;
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
  const response = await api.get(`/chats/${chatId}/messages`);
  return response.data;
};

// Query API
export const queryRAG = async (chatId: string, question: string): Promise<QueryResponse> => {
  const response = await api.post('/query', { chat_id: chatId, question });
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string; loaded_projects: number }> => {
  const response = await api.get('/health');
  return response.data;
};