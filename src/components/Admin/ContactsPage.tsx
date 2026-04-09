import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';
import LinkBox from './LinkBox';

interface ContactSummary {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  fonction: string;
  token: string;
  scriptCount: number;
  validatedCount: number;
}

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/contacts', {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json() as { contacts: ContactSummary[] };
      setContacts(data.contacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-invox-dark">Contacts</h1>
        <button
          onClick={() => navigate('/admin/contacts/new')}
          className="flex items-center gap-2 bg-invox-blue text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-invox-dark transition-colors"
        >
          <Plus size={16} />
          Nouveau contact
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-invox-blue" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
          <button onClick={loadContacts} className="ml-3 underline">Réessayer</button>
        </div>
      )}

      {!loading && !error && contacts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Aucun contact</p>
          <p className="text-sm mt-1">Créez votre premier contact pour commencer.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {contacts.map((c) => {
          const progress = c.scriptCount > 0 ? Math.round((c.validatedCount / c.scriptCount) * 100) : 0;

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-invox-dark">
                    {c.prenom} {c.nom}
                  </p>
                  {c.fonction && (
                    <p className="text-xs text-gray-500 mt-0.5">{c.fonction}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/admin/contacts/${c.id}`)}
                  className="text-gray-400 hover:text-invox-blue transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {c.scriptCount > 0 ? (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{c.validatedCount} / {c.scriptCount} tourné{c.validatedCount !== 1 ? 's' : ''}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: progress === 100 ? '#22c55e' : '#3E9FD9',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Aucun script</p>
              )}

              {c.token
                ? <LinkBox token={c.token} />
                : <p className="text-xs text-gray-400 text-center">Token en cours de génération…</p>
              }
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
