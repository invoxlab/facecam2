import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useCamera, CameraError } from '../../hooks/useCamera';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import { useProject } from '../../hooks/useProjects';
import ScrollingText, { ScrollingTextHandle } from './ScrollingText';
import Countdown from './Countdown';
import RecordingControls from './RecordingControls';
import RecordingIndicator from './RecordingIndicator';
import { CameraOff, RefreshCw, AlertCircle } from 'lucide-react';

type TeleMode = 'rehearse' | 'record';

function CameraErrorScreen({ error, retry }: { error: CameraError; retry: () => void }) {
  const messages: Record<CameraError, { title: string; body: string }> = {
    'permission-denied': {
      title: 'Accès caméra refusé',
      body: 'Autorise l\'accès à la caméra dans les paramètres de ton navigateur, puis réessaie.',
    },
    'not-found': {
      title: 'Caméra introuvable',
      body: 'Aucune caméra détectée sur cet appareil.',
    },
    'not-supported': {
      title: 'Navigateur incompatible',
      body: 'Ton navigateur ne supporte pas l\'accès à la caméra. Utilise Chrome ou Safari récent.',
    },
    'unknown': {
      title: 'Erreur caméra',
      body: 'Une erreur inattendue s\'est produite.',
    },
  };

  const msg = messages[error];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <CameraOff size={48} className="mb-4 text-gray-400" />
      <h2 className="text-xl font-bold mb-2 text-center">{msg.title}</h2>
      <p className="text-gray-400 text-sm text-center mb-6">{msg.body}</p>
      <button
        onClick={retry}
        className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-medium"
      >
        <RefreshCw size={18} />
        Réessayer
      </button>
    </div>
  );
}

const TeleprompterView = () => {
  const { id, spaceId = 'default' } = useParams<{ id: string; spaceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = (searchParams.get('mode') || 'rehearse') as TeleMode;

  const { project, updateSettings } = useProject(id);
  const videoFormat = project?.settings.videoFormat ?? 'landscape';
  const { stream, error: cameraError, isLoading: cameraLoading, retry } = useCamera(videoFormat);
  const recorder = useMediaRecorder();

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<ScrollingTextHandle>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [localSpeed, setLocalSpeed] = useState(5);

  // Sync speed from project
  useEffect(() => {
    if (project) setLocalSpeed(project.settings.scrollSpeed);
  }, [project?.id]);

  // Attacher le stream à la vidéo
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Wake lock
  useEffect(() => {
    const acquire = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          // ignore
        }
      }
    };
    acquire();
    return () => {
      wakeLockRef.current?.release();
    };
  }, []);

  // Quand l'enregistrement est terminé → naviguer vers preview
  // videoStore contient déjà le blob URL, pas besoin de le passer via router state
  useEffect(() => {
    if (recorder.state === 'stopped') {
      navigate(`/s/${spaceId}/project/${id}/preview`);
    }
  }, [recorder.state]);

  const handlePlayPause = useCallback(() => {
    if (mode === 'record' && recorder.state === 'idle' && !isPlaying) {
      // Lancer le décompte avant le premier enregistrement
      setShowCountdown(true);
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      if (mode === 'record' && recorder.state === 'recording') {
        recorder.pause();
      }
    } else {
      setIsPlaying(true);
      if (mode === 'record' && recorder.state === 'paused') {
        recorder.resume();
      }
    }
  }, [isPlaying, mode, recorder]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    if (stream) {
      recorder.start(stream);
      setIsPlaying(true);
    }
  }, [stream, recorder]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    recorder.stop();
  }, [recorder]);

  const handleReset = useCallback(() => {
    scrollRef.current?.reset();
    setIsPlaying(false);
  }, []);

  const handleQuit = useCallback(() => {
    navigate(`/s/${spaceId}/project/${id}`);
  }, [id, spaceId, navigate]);

  const handleSpeedChange = useCallback((delta: number) => {
    setLocalSpeed(prev => {
      const next = Math.min(10, Math.max(1, prev + delta));
      if (id) updateSettings(id, { scrollSpeed: next });
      return next;
    });
  }, [id, updateSettings]);

  // Vibration au démarrage/arrêt
  useEffect(() => {
    if (!('vibrate' in navigator)) return;
    if (recorder.state === 'recording') navigator.vibrate(100);
    if (recorder.state === 'stopped') navigator.vibrate([100, 50, 100]);
  }, [recorder.state]);

  if (cameraLoading) {
    return (
      <div className="min-h-dvh bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fontSize = project?.settings.fontSize ?? 28;
  const textOpacity = project?.settings.textOpacity ?? 0.75;
  const mirrorCamera = project?.settings.mirrorCamera ?? true;
  const script = project?.script ?? '';
  const isPortrait = videoFormat === 'portrait';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Flux caméra — centré et contraint au bon ratio */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: '#000' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            transform: mirrorCamera ? 'scaleX(-1)' : 'none',
            // En portrait : bandes noires à gauche/droite (pillarbox)
            // En paysage : plein écran classique
            ...(isPortrait
              ? { height: '100%', width: 'auto', maxWidth: '100%' }
              : { width: '100%', height: '100%', objectFit: 'cover' }),
          }}
        />
      </div>

      {/* Erreur caméra */}
      {cameraError && <CameraErrorScreen error={cameraError} retry={retry} />}

      {/* Texte défilant */}
      {!cameraError && script && (
        <ScrollingText
          ref={scrollRef}
          text={script}
          speed={localSpeed}
          isPlaying={isPlaying}
          fontSize={fontSize}
          opacity={textOpacity}
        />
      )}

      {/* Message script vide */}
      {!cameraError && !script && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 rounded-2xl px-6 py-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-400" />
            <p className="text-white text-sm">Script vide — retourne à l'éditeur</p>
          </div>
        </div>
      )}

      {/* Overlay pause */}
      {!isPlaying && !showCountdown && (
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      )}

      {/* Décompte */}
      {showCountdown && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      {/* Indicateur enregistrement */}
      {mode === 'record' && (recorder.state === 'recording' || recorder.state === 'paused') && (
        <div className="absolute top-4 left-0 right-0 flex justify-center z-20">
          <RecordingIndicator
            duration={recorder.duration}
            isPaused={recorder.state === 'paused'}
          />
        </div>
      )}

      {/* Contrôles */}
      {!cameraError && (
        <RecordingControls
          mode={mode}
          isPlaying={isPlaying}
          recorderState={recorder.state}
          speed={localSpeed}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onReset={handleReset}
          onQuit={handleQuit}
          onSpeedChange={handleSpeedChange}
        />
      )}
    </div>
  );
};

export default TeleprompterView;
