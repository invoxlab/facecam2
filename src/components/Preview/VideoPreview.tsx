import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, RotateCcw, Home } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { videoStore } from '../../lib/videoStore';
import { db } from '../../lib/db';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Ko';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const VideoPreview = () => {
  const { id, spaceId = 'default' } = useParams<{ id: string; spaceId: string }>();
  const navigate = useNavigate();
  const { currentProject, validateProject } = useProjectStore();

  const record = videoStore.get();
  const blobUrl = record?.url ?? null;
  const mimeType = record?.mimeType ?? 'video/webm';
  const fileSize = record?.blob.size ?? 0;

  const [videoDuration, setVideoDuration] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fix durée WebM
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !blobUrl) return;

    const fixDuration = () => {
      if (!isFinite(video.duration) || video.duration === 0) {
        video.currentTime = 9999;
      } else {
        setVideoDuration(video.duration);
      }
    };

    const onSeeked = () => {
      if (video.currentTime > 0) {
        setVideoDuration(video.currentTime);
        video.currentTime = 0;
      }
    };

    if (video.readyState >= 1) fixDuration();
    else video.addEventListener('loadedmetadata', fixDuration);
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', fixDuration);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [blobUrl]);

  const handleValidate = async () => {
    if (!id || !record?.blob) return;
    setIsValidating(true);

    try {
      // Sauvegarder la vidéo dans IndexedDB
      await db.saveVideo({
        projectId: id,
        blob: record.blob,
        mimeType,
        recordedAt: Date.now(),
      });

      // Marquer le projet comme validé
      await validateProject(id, { duration: videoDuration, size: fileSize });

      // Déclencher le téléchargement
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const projectName = currentProject?.name ?? 'teleprompt';
      const date = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', 'h');
      const filename = `${projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${date}.${ext}`;
      const a = document.createElement('a');
      a.href = blobUrl!;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 300);

      // Retourner à l'accueil
      navigate(`/s/${spaceId}`);
    } catch (err) {
      console.error('Erreur validation:', err);
      setIsValidating(false);
    }
  };

  const handleRetake = () => {
    navigate(`/s/${spaceId}/project/${id}/teleprompter?mode=record`);
  };

  const handleHome = () => {
    videoStore.clear();
    navigate(`/s/${spaceId}`);
  };

  const durationStr = formatDuration(videoDuration);

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/s/${spaceId}/project/${id}`)}
            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-xl transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-white font-semibold">Prévisualisation</h1>
            <p className="text-gray-400 text-xs">
              {durationStr || '—'}
              {fileSize > 0 && ` · ${formatFileSize(fileSize)}`}
            </p>
          </div>
        </div>
      </header>

      {/* Lecteur vidéo */}
      <div className="flex-1 flex items-center justify-center bg-black">
        {blobUrl && fileSize > 0 ? (
          <video
            ref={videoRef}
            src={blobUrl}
            controls
            playsInline
            preload="metadata"
            className="max-h-[60vh] max-w-full"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-400 p-8 text-center">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-sm font-medium text-white">Enregistrement vide</p>
            <button onClick={handleRetake} className="mt-2 text-blue-400 text-sm underline">
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-3">
        {/* Valider */}
        <button
          onClick={handleValidate}
          disabled={!blobUrl || fileSize === 0 || isValidating}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 text-white font-semibold text-base disabled:opacity-40 active:scale-95 transition-transform"
        >
          <CheckCircle size={20} />
          {isValidating ? 'Validation…' : 'Valider cette prise'}
        </button>

        <div className="flex gap-3">
          {/* Recommencer */}
          <button
            onClick={handleRetake}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-600 text-gray-300 font-medium text-sm active:scale-95 transition-transform"
          >
            <RotateCcw size={18} />
            Recommencer
          </button>

          {/* Retour accueil */}
          <button
            onClick={handleHome}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-600 text-gray-300 font-medium text-sm active:scale-95 transition-transform"
          >
            <Home size={18} />
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
