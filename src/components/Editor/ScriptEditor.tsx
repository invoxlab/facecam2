import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Eye, Video, Smartphone, Monitor } from 'lucide-react';
import { useProject } from '../../hooks/useProjects';
import SpeedSlider from './SpeedSlider';
import ReadingTimeEstimate from './ReadingTimeEstimate';

const ScriptEditor = () => {
  const { id, spaceId = 'default' } = useParams<{ id: string; spaceId: string }>();
  const navigate = useNavigate();
  const { project, isLoading, updateProject, updateSettings } = useProject(id);

  const [localName, setLocalName] = useState('');
  const [localScript, setLocalScript] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync local state from store
  useEffect(() => {
    if (project) {
      setLocalName(project.name);
      setLocalScript(project.script);
    }
  }, [project?.id]);

  // Auto-save avec debounce 500ms
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
    if (e.key === 'Enter') {
      nameInputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Projet introuvable</p>
          <button onClick={() => navigate(`/s/${spaceId}`)} className="text-blue-600 font-medium">
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
            onClick={() => navigate(`/s/${spaceId}`)}
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
                className="w-full text-base font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none py-0.5"
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
                <span className="block text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {localName || 'Sans titre'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Zone de texte principale */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-2">
        <textarea
          value={localScript}
          onChange={handleScriptChange}
          placeholder="Écris ou colle ton script ici…"
          className="w-full h-full min-h-[40vh] resize-none bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-gray-900 text-base leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ fontSize: `${project.settings.fontSize}px` }}
          spellCheck
          autoFocus
        />
      </div>

      {/* Panneau paramètres collapsible */}
      <div className="max-w-lg mx-auto w-full px-4 pb-2">
        <button
          onClick={() => setShowSettings(s => !s)}
          className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-600"
        >
          <span>Paramètres</span>
          {showSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showSettings && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 mb-2">
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
            <SpeedSlider
              label="Mots par minute"
              value={project.settings.wordsPerMinute}
              min={80}
              max={250}
              step={10}
              onChange={v => id && updateSettings(id, { wordsPerMinute: v })}
              formatValue={v => `${v}`}
            />
            {/* Choix du format vidéo */}
            <div>
              <span className="text-sm text-gray-600 block mb-2">Format vidéo</span>
              <div className="flex gap-2">
                <button
                  onClick={() => id && updateSettings(id, { videoFormat: 'landscape' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                    project.settings.videoFormat !== 'portrait'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
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
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Smartphone size={16} />
                  Vertical 9:16
                </button>
              </div>
            </div>

            <div className="pt-1">
              <ReadingTimeEstimate
                script={localScript}
                wordsPerMinute={project.settings.wordsPerMinute}
              />
            </div>
          </div>
        )}
      </div>

      {/* Boutons d'action sticky */}
      <div className="max-w-lg mx-auto w-full px-4 pb-6 pt-2 flex gap-3">
        <button
          onClick={() => navigate(`/s/${spaceId}/project/${id}/teleprompter?mode=rehearse`)}
          disabled={!canRecord}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-blue-600 text-blue-600 font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <Eye size={20} />
          Répéter
        </button>
        <button
          onClick={() => navigate(`/s/${spaceId}/project/${id}/teleprompter?mode=record`)}
          disabled={!canRecord}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <Video size={20} />
          Enregistrer
        </button>
      </div>
    </div>
  );
};

export default ScriptEditor;
