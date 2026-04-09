import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, ChevronRight, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';
import LinkBox from './LinkBox';

interface Ambassadeur {
  id: string;
  prenom: string;
  nom: string;
  fonction: string;
  token: string;
  scriptCount: number;
  validatedCount: number;
}

interface CompanyDetail {
  id: string;
  nom: string;
  statut: string;
  smm: string;
  ambassadeurs: Ambassadeur[];
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadCompany(); }, [id]);

  const loadCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/company?id=${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json() as CompanyDetail;
      setCompany(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const statutColor = (s: string) =>
    s === 'En cours' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-invox-blue" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !company) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error ?? 'Entreprise introuvable'}
          <button onClick={() => navigate('/admin/companies')} className="ml-3 underline">Retour</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/companies')}
          className="p-2 -ml-2 mt-0.5 text-gray-400 hover:text-invox-dark rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-invox-dark">{company.nom}</h1>
            {company.statut && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor(company.statut)}`}>
                {company.statut}
              </span>
            )}
          </div>
          {company.smm && <p className="text-sm text-gray-500 mt-0.5">SMM : {company.smm}</p>}
        </div>
      </div>

      {/* Ambassadeurs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-invox-dark">
          Ambassadeurs
          <span className="ml-2 text-sm font-normal text-gray-400">({company.ambassadeurs.length})</span>
        </h2>
        <button
          onClick={() => navigate(`/admin/contacts/new?companyId=${id}`)}
          className="flex items-center gap-1.5 text-sm text-invox-blue font-medium hover:text-invox-dark transition-colors"
        >
          <UserPlus size={15} />
          Nouvel ambassadeur
        </button>
      </div>

      {company.ambassadeurs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Aucun ambassadeur pour l'instant.</p>
          <button
            onClick={() => navigate(`/admin/contacts/new?companyId=${id}`)}
            className="mt-3 text-invox-blue text-sm font-medium"
          >
            Ajouter le premier ambassadeur →
          </button>
        </div>
      )}

      <div className="space-y-3">
        {company.ambassadeurs.map((a) => {
          const progress = a.scriptCount > 0
            ? Math.round((a.validatedCount / a.scriptCount) * 100)
            : 0;
          const allDone = a.scriptCount > 0 && a.validatedCount === a.scriptCount;

          return (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-invox-dark">
                    {a.prenom} {a.nom}
                  </p>
                  {a.fonction && <p className="text-xs text-gray-500 mt-0.5">{a.fonction}</p>}
                </div>
                <button
                  onClick={() => navigate(`/admin/contacts/${a.id}`)}
                  className="p-1.5 text-gray-400 hover:text-invox-blue transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Progression scripts */}
              {a.scriptCount > 0 ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      {allDone
                        ? <CheckCircle2 size={12} className="text-green-500" />
                        : <Clock size={12} />}
                      {a.validatedCount} / {a.scriptCount} script{a.scriptCount !== 1 ? 's' : ''}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: allDone ? '#22c55e' : '#3E9FD9',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Aucun script</p>
              )}

              {/* URL */}
              {a.token && <LinkBox token={a.token} />}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
