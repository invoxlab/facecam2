import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Video, Smartphone, Monitor, Settings } from 'lucide-react';
import { useProject } from '../../hooks/useProjects';
import SpeedSlider from './SpeedSlider';
import ReadingTimeEstimate from './ReadingTimeEstimate';

const ScriptEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, isLoading, updateProject, updateSettings } = useProject(id);

  const [localName, setLocalName] = useState('');
  const [localScript, setLocalScript] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setLocalName(project.name);
      setLocalScript(project.script);
    }
  }, [project?.id]);

  const scheduleScriptSave = useCallback((script: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (id) updateProject(id, { script });
    }, 500);
  }, [id, updateProject]);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalScript(value);
    scheduleScriptSave(value);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (id && localName.trim() && localName !== project?.name) {
      updateProject(id, { name: localName.trim() });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') nameInputRef.current?.blur();
  };

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-invox-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Projet introuvable</p>
          <button onClick={() => navigate('/')} className="text-invox-blue font-medium">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const canRecord = localScript.trim().length > 0;

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-xl transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Nom éditable inline */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                maxLength={80}
                className="w-full text-base font-semibold text-gray-900 bg-transparent border-b-2 border-invox-blue outline-none py-0.5"
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="w-full text-left group"
                title="Cliquer pour modifier le titre"
              >
                <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                  Titre du script
                </span>
                <span className="block text-base font-semibold text-gray-900 truncate group-hover:text-invox-blue transition-colors">
                  {localName || 'Sans titre'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Boutons d'action + Settings — AU-DESSUS du texte pour ne pas être cachés par le clavier */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/project/${id}/teleprompter?mode=rehearse`)}
            disabled={!canRecord}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-invox-blue text-invox-blue font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Eye size={16} />
            Répéter
          </button>
          <button
            onClick={() => navigate(`/project/${id}/teleprompter?mode=record`)}
            disabled={!canRecord}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-invox-orange text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Video size={16} />
            Enregistrer
          </button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`p-2.5 rounded-xl border-2 transition-colors ${
              showSettings ? 'border-invox-dark bg-invox-dark/5 text-invox-dark' : 'border-gray-200 text-gray-400'
            }`}
            aria-label="Paramètres"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Estimation temps de lecture */}
        {localScript.trim() && (
          <div className="mt-2">
            <ReadingTimeEstimate script={localScript} />
          </div>
        )}
      </div>

      {/* Panneau paramètres collapsible */}
      {showSettings && (
        <div className="max-w-lg mx-auto w-full px-4 pb-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <SpeedSlider
              label="Vitesse défilement"
              value={project.settings.scrollSpeed}
              min={1}
              max={10}
              onChange={v => id && updateSettings(id, { scrollSpeed: v })}
            />
            <SpeedSlider
              label="Taille du texte"
              value={project.settings.fontSize}
              min={16}
              max={48}
              step={2}
              onChange={v => id && updateSettings(id, { fontSize: v })}
              formatValue={v => `${v}px`}
            />
            {/* Choix du format vidéo */}
            <div>
              <span className="text-sm text-gray-600 block mb-2">Format vidéo</span>
              <div className="flex gap-2">
                <button
                  onClick={() => id && updateSettings(id, { videoFormat: 'landscape' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                    project.settings.videoFormat !== 'portrait'
                      ? 'border-invox-blue bg-invox-blue/10 text-invox-dark'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Monitor size={16} />
                  Horizontal 16:9
                </button>
                <button
                  onClick={() => id && updateSettings(id, { videoFormat: 'portrait' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                    project.settings.videoFormat === 'portrait'
                      ? 'border-invox-blue bg-invox-blue/10 text-invox-dark'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Smartphone size={16} />
                  Vertical 9:16
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note / instructions admin */}
      {project.instructions && (
        <div className="max-w-lg mx-auto w-full px-4 pb-2">
          <div className="bg-invox-yellow/20 border border-invox-yellow rounded-xl px-4 py-3 flex gap-2">
            <span className="text-base">📋</span>
            <p className="text-sm text-invox-dark leading-relaxed">{project.instructions}</p>
          </div>
        </div>
      )}

      {/* Zone de texte principale */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-2 pb-4">
        <textarea
          value={localScript}
          onChange={handleScriptChange}
          placeholder="Écris ou colle ton script ici…"
          className="w-full h-full min-h-[40vh] resize-none bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-gray-900 text-base leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-invox-blue focus:border-transparent"
          style={{ fontSize: `${project.settings.fontSize}px` }}
          spellCheck
          autoFocus
        />
      </div>
    </div>
  );
};

export default ScriptEditor;
