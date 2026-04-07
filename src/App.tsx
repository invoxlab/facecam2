import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProjectList from './components/Projects/ProjectList';
import ScriptEditor from './components/Editor/ScriptEditor';
import TeleprompterView from './components/Teleprompter/TeleprompterView';
import VideoPreview from './components/Preview/VideoPreview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Accueil direct sur la liste des projets */}
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ScriptEditor />} />
        <Route path="/project/:id/teleprompter" element={<TeleprompterView />} />
        <Route path="/project/:id/preview" element={<VideoPreview />} />

        {/* Ancien format /s/:spaceId redirige vers / */}
        <Route path="/s/*" element={<Navigate to="/" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
