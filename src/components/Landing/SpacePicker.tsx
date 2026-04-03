import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowRight } from 'lucide-react';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SpacePicker = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(name);
    if (slug) navigate(`/s/${slug}`);
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Video size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TelePrompt</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Enregistrez vos vidéos face caméra en lisant votre script
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Votre prénom ou identifiant
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex : guilhem, marie-dupont…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              autoFocus
              autoCapitalize="none"
            />
            {name && (
              <p className="text-xs text-gray-400 mt-1.5">
                Votre espace : <span className="font-mono text-blue-600">/s/{slugify(name)}</span>
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!slugify(name)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Accéder à mes projets
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SpacePicker;
