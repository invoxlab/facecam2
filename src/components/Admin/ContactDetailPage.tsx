import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle2, Clock, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';
import LinkBox from './LinkBox';

interface Script {
  airtableId: string;
  titre: string;
  instructions: string;
  ordre: number;
  validated: boolean;
  videoUrl: string;
}

interface ContactDetail {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  mobile: string;
  fonction: string;
  token: string;
  scripts: Script[];
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add script form
  const [showAddScript, setShowAddScript] = useState(false);
  const [newTitre, setNewTitre] = useState('');
  const [newScript, setNewScript] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [addingScript, setAddingScript] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    loadContact();
  }, [id]);

  const loadContact = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/contact?id=${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json() as ContactDetail;
      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingScript(true);
    setAddError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          action: 'add-script',
          contactId: id,
          script: {
            titre: newTitre,
            script: newScript,
            instructions: newInstructions,
            ordre: (contact?.scripts.length ?? 0) + 1,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }
      setNewTitre('');
      setNewScript('');
      setNewInstructions('');
      setShowAddScript(false);
      await loadContact();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setAddingScript(false);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!confirm('Supprimer ce script ?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/admin/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ action: 'delete-script', scriptId }),
      });
      await loadContact();
    } catch {
      // silent fail
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-invox-blue" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !contact) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error ?? 'Contact introuvable'}
          <button onClick={() => navigate('/admin/contacts')} className="ml-3 underline">
            Retour
          </button>
        </div>
      </AdminLayout>
    );
  }

  const validatedCount = contact.scripts.filter((s) => s.validated).length;

  return (
    <AdminLayout>
      {/* Header contact */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/contacts')}
          className="p-2 -ml-2 mt-0.5 text-gray-400 hover:text-invox-dark rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-invox-dark">
            {contact.prenom} {contact.nom}
          </h1>
          {contact.fonction && <p className="text-sm text-gray-500">{contact.fonction}</p>}
          {contact.email && <p className="text-xs text-gray-400">{contact.email}</p>}
        </div>
      </div>

      {/* Lien + progression */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Progression</p>
            <p className="text-sm font-semibold text-invox-dark mt-0.5">
              {validatedCount} / {contact.scripts.length} script{contact.scripts.length !== 1 ? 's' : ''} tourné{validatedCount !== 1 ? 's' : ''}
            </p>
          </div>
          {contact.scripts.length > 0 && (
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((validatedCount / contact.scripts.length) * 100)}%`,
                  backgroundColor: validatedCount === contact.scripts.length ? '#22c55e' : '#3E9FD9',
                }}
              />
            </div>
          )}
        </div>

        {contact.token
          ? <LinkBox token={contact.token} />
          : <p className="text-xs text-gray-400 text-center">Token en cours de génération…</p>
        }
      </div>

      {/* Scripts */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-invox-dark">Scripts</h2>
        <button
          onClick={() => setShowAddScript(!showAddScript)}
          className="flex items-center gap-1.5 text-sm text-invox-blue font-medium hover:text-invox-dark transition-colors"
        >
          <Plus size={15} />
          Ajouter
        </button>
      </div>

      {/* Formulaire ajout script */}
      {showAddScript && (
        <form onSubmit={handleAddScript} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3 space-y-3">
          <p className="text-xs font-semibold text-invox-blue uppercase tracking-wide">Nouveau script</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
            <input
              type="text"
              required
              value={newTitre}
              onChange={(e) => setNewTitre(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
              placeholder="Titre du script"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Script *</label>
            <textarea
              required
              rows={4}
              value={newScript}
              onChange={(e) => setNewScript(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
            <input
              type="text"
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
            />
          </div>
          {addError && <p className="text-red-500 text-xs">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddScript(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addingScript}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-invox-blue text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {addingScript && <Loader2 size={14} className="animate-spin" />}
              Ajouter
            </button>
          </div>
        </form>
      )}

      {contact.scripts.length === 0 && !showAddScript && (
        <p className="text-sm text-gray-400 text-center py-6">Aucun script. Ajoutez-en un ci-dessus.</p>
      )}

      <div className="space-y-2">
        {contact.scripts.map((s) => (
          <div key={s.airtableId} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {s.validated ? (
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Clock size={18} className="text-gray-300 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-invox-dark text-sm truncate">{s.titre}</p>
                  {s.instructions && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{s.instructions}</p>
                  )}
                  <span
                    className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.validated
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s.validated ? 'Validé' : 'À tourner'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {s.validated && s.videoUrl && (
                  <a
                    href={s.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-invox-blue transition-colors"
                    title="Télécharger la vidéo"
                  >
                    <Download size={16} />
                  </a>
                )}
                <button
                  onClick={() => handleDeleteScript(s.airtableId)}
                  className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
