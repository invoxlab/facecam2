import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Video, Link, CheckCircle } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import { useProjects } from '../../hooks/useProjects';

type Tab = 'to-record' | 'validated';

const ProjectList = () => {
  const { spaceId = 'default' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { projects, isLoading, createProject, deleteProject } = useProjects(spaceId);

  const [tab, setTab] = useState<Tab>('to-record');
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toRecord = projects.filter(p => p.status !== 'validated');
  const validated = projects.filter(p => p.status === 'validated');
  const displayed = tab === 'to-record' ? toRecord : validated;

  const handleCreate = async (name: string) => {
    const project = await createProject(name, spaceId);
    setShowForm(false);
    navigate(`/s/${spaceId}/project/${project.id}`);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteProject(deletingId);
      setDeletingId(null);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = spaceId.replace(/-/g, ' ');

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Video size={20} className="text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900 capitalize">{displayName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyUrl}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50"
                title="Copier le lien de cet espace"
              >
                {copied ? <CheckCircle size={14} className="text-green-500" /> : <Link size={14} />}
                {copied ? 'Copié !' : 'Partager'}
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium"
              >
                <Plus size={16} />
                Nouveau
              </button>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="max-w-lg mx-auto px-4">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('to-record')}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'to-record'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              À tourner
              {toRecord.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5">
                  {toRecord.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('validated')}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'validated'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Déjà tournés
              {validated.length > 0 && (
                <span className="ml-1.5 bg-green-100 text-green-700 text-xs rounded-full px-1.5 py-0.5">
                  {validated.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Liste */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {tab === 'to-record' ? (
              <>
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Video size={28} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Aucun script à tourner</h2>
                <p className="text-gray-500 text-sm mb-5">Créez votre premier projet pour commencer.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium text-sm"
                >
                  <Plus size={18} />
                  Créer un projet
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Aucune vidéo validée</h2>
                <p className="text-gray-500 text-sm">Les projets validés apparaîtront ici.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/s/${spaceId}/project/${project.id}`)}
                onDelete={() => setDeletingId(project.id)}
                spaceId={spaceId}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouveau projet</h2>
            <form onSubmit={e => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value; if (v.trim()) handleCreate(v.trim()); }}>
              <input
                name="name"
                type="text"
                placeholder="Nom du script…"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mb-4"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm">Annuler</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Supprimer ce projet ?</h2>
            <p className="text-gray-500 text-sm mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm">Annuler</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
