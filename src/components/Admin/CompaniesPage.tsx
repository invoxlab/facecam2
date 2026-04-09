import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Loader2, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';

interface Company {
  id: string;
  nom: string;
  statut: string;
  smm: string;
  ambassadeurCount: number;
}

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nouveau formulaire inline
  const [showForm, setShowForm] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/companies', {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json() as { companies: Company[] };
      setCompanies(data.companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ nom: newNom, statut: 'En cours' }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json() as { companyId: string };
      setNewNom('');
      setShowForm(false);
      navigate(`/admin/companies/${data.companyId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const statutColor = (s: string) =>
    s === 'En cours' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-invox-dark">Entreprises</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-invox-blue text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-invox-dark transition-colors"
        >
          <Plus size={16} />
          Nouvelle entreprise
        </button>
      </div>

      {/* Formulaire création rapide */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex gap-3">
          <input
            type="text"
            required
            autoFocus
            value={newNom}
            onChange={(e) => setNewNom(e.target.value)}
            placeholder="Nom de l'entreprise"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
          />
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-invox-blue text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {creating && <Loader2 size={14} className="animate-spin" />}
            Créer
          </button>
        </form>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-invox-blue" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
          <button onClick={loadCompanies} className="ml-3 underline">Réessayer</button>
        </div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Building2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune entreprise</p>
          <p className="text-sm mt-1">Créez votre première entreprise pour commencer.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {companies.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/admin/companies/${c.id}`)}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-invox-blue transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-invox-dark truncate">{c.nom}</p>
                {c.smm && <p className="text-xs text-gray-400 mt-0.5">{c.smm}</p>}
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-invox-blue mt-0.5 shrink-0 transition-colors" />
            </div>
            <div className="flex items-center gap-2 mt-3">
              {c.statut && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor(c.statut)}`}>
                  {c.statut}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {c.ambassadeurCount} ambassadeur{c.ambassadeurCount !== 1 ? 's' : ''}
              </span>
            </div>
          </button>
        ))}
      </div>
    </AdminLayout>
  );
}
