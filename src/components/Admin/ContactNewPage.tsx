import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';

interface ScriptDraft {
  titre: string;
  script: string;
  instructions: string;
  ordre: number;
}

export default function ContactNewPage() {
  const navigate = useNavigate();

  // Étape 1 : infos contact
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [fonction, setFonction] = useState('');

  // Étape 2 : scripts
  const [step, setStep] = useState<1 | 2>(1);
  const [scripts, setScripts] = useState<ScriptDraft[]>([
    { titre: '', script: '', instructions: '', ordre: 1 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addScript = () => {
    setScripts((prev) => [
      ...prev,
      { titre: '', script: '', instructions: '', ordre: prev.length + 1 },
    ]);
  };

  const removeScript = (index: number) => {
    setScripts((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, ordre: i + 1 }))
    );
  };

  const updateScript = (index: number, field: keyof ScriptDraft, value: string | number) => {
    setScripts((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ prenom, nom, email, mobile, fonction, scripts }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const data = await res.json() as { contactId: string };
      navigate(`/admin/contacts/${data.contactId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate('/admin/contacts'))}
          className="p-2 -ml-2 text-gray-400 hover:text-invox-dark rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-invox-dark">Nouveau contact</h1>
          <p className="text-xs text-gray-400">Étape {step} / 2</p>
        </div>
      </div>

      {/* Étape 1 : Infos contact */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
                placeholder="Marie"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
                placeholder="Martin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
              placeholder="marie.martin@exemple.fr"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
              placeholder="+33 6 00 00 00 00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fonction</label>
            <input
              type="text"
              value={fonction}
              onChange={(e) => setFonction(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
              placeholder="Directrice Marketing"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-invox-blue text-white rounded-xl font-medium text-sm hover:bg-invox-dark transition-colors"
          >
            Suivant → Scripts
          </button>
        </form>
      )}

      {/* Étape 2 : Scripts */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {scripts.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-invox-blue uppercase tracking-wide">
                  Script {i + 1}
                </span>
                {scripts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScript(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
                <input
                  type="text"
                  required
                  value={s.titre}
                  onChange={(e) => updateScript(i, 'titre', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
                  placeholder="Présentation entreprise"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Script *</label>
                <textarea
                  required
                  rows={5}
                  value={s.script}
                  onChange={(e) => updateScript(i, 'script', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue resize-none"
                  placeholder="Bonjour, je m'appelle…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Instructions (optionnel)
                </label>
                <input
                  type="text"
                  value={s.instructions}
                  onChange={(e) => updateScript(i, 'instructions', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-invox-blue"
                  placeholder="Parler lentement, fond blanc"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addScript}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-invox-blue hover:text-invox-blue text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Ajouter un script
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Création en cours…' : 'Créer le contact'}
          </button>
        </form>
      )}
    </AdminLayout>
  );
}
