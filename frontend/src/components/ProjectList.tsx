import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Calendar, ExternalLink } from 'lucide-react';
import { Project, getProjects } from '../services/api';
import './ProjectList.css';

interface ProjectListProps {
  onCreateProject: () => void;
  onSelectProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onCreateProject, onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await getProjects();
      setProjects(projectList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="project-list-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <div className="header-content">
          <FolderOpen className="header-icon" />
          <div>
            <pre className="ascii-title">{`
██████╗  █████╗  ██████╗ ███╗   ██╗ █████╗ ██████╗  ██████╗ ██╗  ██╗
██╔══██╗██╔══██╗██╔════╝ ████╗  ██║██╔══██╗██╔══██╗██╔═══██╗██║ ██╔╝
██████╔╝███████║██║  ███╗██╔██╗ ██║███████║██████╔╝██║   ██║█████╔╝ 
██╔══██╗██╔══██║██║   ██║██║╚██╗██║██╔══██║██╔══██╗██║   ██║██╔═██╗ 
██║  ██║██║  ██║╚██████╔╝██║ ╚████║██║  ██║██║  ██║╚██████╔╝██║  ██╗
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
            `}</pre>
            <p>Manage your knowledge bases and conversations</p>
          </div>
        </div>
        <button className="create-project-btn" onClick={onCreateProject}>
          <Plus size={20} />
          New Project
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={64} className="empty-icon" />
            <h3>No projects yet</h3>
            <p>Create your first RAG project to get started</p>
            <button className="create-first-project-btn" onClick={onCreateProject}>
              <Plus size={20} />
              Create Your First Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => onSelectProject(project)}
            >
              <div className="project-header">
                <h3>{project.name}</h3>
                <Calendar size={16} className="date-icon" />
              </div>
              
              {project.description && (
                <p className="project-description">{project.description}</p>
              )}
              
              <div className="project-urls">
                <h4>Sources ({project.urls.length})</h4>
                <div className="url-list">
                  {project.urls.slice(0, 3).map((url, index) => (
                    <div key={index} className="url-item">
                      <ExternalLink size={12} />
                      <span>{new URL(url).hostname}</span>
                    </div>
                  ))}
                  {project.urls.length > 3 && (
                    <div className="url-item more">
                      +{project.urls.length - 3} more
                    </div>
                  )}
                </div>
              </div>
              
              <div className="project-footer">
                <span className="project-date">
                  Created {formatDate(project.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;