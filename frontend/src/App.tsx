import React, { useState } from 'react';
import './App.css';
import ProjectList from './components/ProjectList';
import CreateProject from './components/CreateProject';
import ProjectChatInterface from './components/ProjectChatInterface';
import { Project } from './services/api';

type AppStage = 'projects' | 'create-project' | 'chat';

interface AppState {
  stage: AppStage;
  selectedProject: Project | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    stage: 'projects',
    selectedProject: null
  });

  const handleCreateProject = () => {
    setState({ stage: 'create-project', selectedProject: null });
  };

  const handleProjectCreated = () => {
    setState({ stage: 'projects', selectedProject: null });
  };

  const handleSelectProject = (project: Project) => {
    setState({ stage: 'chat', selectedProject: project });
  };

  const handleBackToProjects = () => {
    setState({ stage: 'projects', selectedProject: null });
  };

  const handleCancelCreate = () => {
    setState({ stage: 'projects', selectedProject: null });
  };

  return (
    <div className="App">
      {state.stage === 'projects' && (
        <ProjectList 
          onCreateProject={handleCreateProject}
          onSelectProject={handleSelectProject}
        />
      )}
      
      {state.stage === 'create-project' && (
        <CreateProject 
          onProjectCreated={handleProjectCreated}
          onCancel={handleCancelCreate}
        />
      )}
      
      {state.stage === 'chat' && state.selectedProject && (
        <ProjectChatInterface 
          project={state.selectedProject}
          onBackToProjects={handleBackToProjects}
        />
      )}
    </div>
  );
}

export default App;
