import React, { useState } from 'react';
import { Plus, X, Globe, Loader, ArrowLeft } from 'lucide-react';
import { createProject } from '../services/api';
import './CreateProject.css';

interface CreateProjectProps {
  onProjectCreated: () => void;
  onCancel: () => void;
}

const CreateProject: React.FC<CreateProjectProps> = ({ onProjectCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addURL = () => {
    if (currentUrl.trim()) {
      setUrls([...urls.filter(url => url.trim()), currentUrl.trim()]);
      setCurrentUrl('');
    }
  };

  const removeURL = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    const validUrls = urls.filter(url => url.trim());
    if (validUrls.length === 0 && !currentUrl.trim()) {
      setError('At least one URL is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalUrls = currentUrl.trim() ? [...validUrls, currentUrl.trim()] : validUrls;
      await createProject(name.trim(), description.trim(), finalUrls);
      onProjectCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaults = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createProject(name.trim(), description.trim(), []);
      onProjectCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addURL();
    }
  };

  return (
    <div className="create-project-container">
      <div className="create-project-card">
        <div className="header">
          <button onClick={onCancel} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div className="header-content">
            <Globe className="header-icon" />
            <h1>Create New Project</h1>
            <p>Set up a new RAG knowledge base</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              className="form-input"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this project is about..."
              className="form-textarea"
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Document Sources</label>
            <div className="url-list">
              {urls.filter(url => url.trim()).map((url, index) => (
                <div key={index} className="url-item">
                  <span className="url-text">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeURL(index)}
                    className="remove-btn"
                    disabled={loading}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="input-section">
              <input
                type="url"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a URL (e.g., https://example.com/docs)"
                className="url-input"
                disabled={loading}
              />
              <button
                type="button"
                onClick={addURL}
                disabled={!currentUrl.trim() || loading}
                className="add-btn"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              disabled={loading || !name.trim() || (urls.filter(url => url.trim()).length === 0 && !currentUrl.trim())}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <Loader className="spinner" size={20} />
                  Creating Project...
                </>
              ) : (
                'Create Project'
              )}
            </button>

            <button
              type="button"
              onClick={handleUseDefaults}
              disabled={loading || !name.trim()}
              className="default-btn"
            >
              Create with Default Docs
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;