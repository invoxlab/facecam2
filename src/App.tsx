import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SpacePicker from './components/Landing/SpacePicker';
import ProjectList from './components/Projects/ProjectList';
import ScriptEditor from './components/Editor/ScriptEditor';
import TeleprompterView from './components/Teleprompter/TeleprompterView';
import VideoPreview from './components/Preview/VideoPreview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing : saisie du nom d'espace */}
        <Route path="/" element={<SpacePicker />} />

        {/* Espace utilisateur */}
        <Route path="/s/:spaceId" element={<ProjectList />} />
        <Route path="/s/:spaceId/project/:id" element={<ScriptEditor />} />
        <Route path="/s/:spaceId/project/:id/teleprompter" element={<TeleprompterView />} />
        <Route path="/s/:spaceId/project/:id/preview" element={<VideoPreview />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
