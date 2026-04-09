import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ProjectList from './components/Projects/ProjectList';
import ScriptEditor from './components/Editor/ScriptEditor';
import TeleprompterView from './components/Teleprompter/TeleprompterView';
import VideoPreview from './components/Preview/VideoPreview';
import AdminGuard from './components/Admin/AdminGuard';
import AdminLogin from './components/Admin/AdminLogin';
import ContactsPage from './components/Admin/ContactsPage';
import ContactNewPage from './components/Admin/ContactNewPage';
import ContactDetailPage from './components/Admin/ContactDetailPage';
import CompaniesPage from './components/Admin/CompaniesPage';
import CompanyDetailPage from './components/Admin/CompanyDetailPage';
import { useProjectStore } from './stores/projectStore';
import { fetchScriptsFromToken, savePerson } from './lib/syncAirtable';

function TokenSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const { importFromAirtable } = useProjectStore();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) return;

    setSyncing(true);
    fetchScriptsFromToken(token)
      .then(async (data) => {
        savePerson(data.person);
        const { added, updated } = await importFromAirtable(data);
        console.log(`Sync Airtable : +${added} nouveaux, ${updated} mis à jour`);
        setSyncing(false);
        navigate('/', { replace: true });
      })
      .catch((err: Error) => {
        console.error('Erreur sync:', err);
        setError(err.message);
        setSyncing(false);
      });
  }, []);

  if (syncing) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4 z-50">
        <div className="w-10 h-10 border-2 border-invox-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm">Chargement de vos scripts…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4 z-50 px-8">
        <p className="text-red-500 font-medium text-center">Lien invalide</p>
        <p className="text-gray-500 text-sm text-center">{error}</p>
        <button
          onClick={() => { setError(null); navigate('/', { replace: true }); }}
          className="mt-2 text-invox-blue font-medium text-sm"
        >
          Continuer quand même →
        </button>
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <TokenSync />
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ScriptEditor />} />
        <Route path="/project/:id/teleprompter" element={<TeleprompterView />} />
        <Route path="/project/:id/preview" element={<VideoPreview />} />
        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/companies" replace />} />
        <Route path="/admin/companies" element={<AdminGuard><CompaniesPage /></AdminGuard>} />
        <Route path="/admin/companies/:id" element={<AdminGuard><CompanyDetailPage /></AdminGuard>} />
        <Route path="/admin/contacts" element={<AdminGuard><ContactsPage /></AdminGuard>} />
        <Route path="/admin/contacts/new" element={<AdminGuard><ContactNewPage /></AdminGuard>} />
        <Route path="/admin/contacts/:id" element={<AdminGuard><ContactDetailPage /></AdminGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
