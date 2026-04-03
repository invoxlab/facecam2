import { Play, Pause, Square, RotateCcw, X } from 'lucide-react';

interface RecordingControlsProps {
  mode: 'rehearse' | 'record';
  isPlaying: boolean;
  recorderState: 'idle' | 'recording' | 'paused' | 'stopped';
  onPlayPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onQuit: () => void;
}

const RecordingControls = ({
  mode,
  isPlaying,
  recorderState,
  onPlayPause,
  onStop,
  onReset,
  onQuit,
}: RecordingControlsProps) => {

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
      <div className="bg-gradient-to-t from-black/80 to-transparent pt-8 pb-6 px-6">
        <div className="flex items-center justify-between max-w-sm mx-auto">

          {/* Gauche : Reset (rehearse) ou Stop (record) */}
          {mode === 'rehearse' ? (
            <button
              onClick={onReset}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white"
              aria-label="Revenir au début"
            >
              <RotateCcw size={22} />
            </button>
          ) : (
            <button
              onClick={onStop}
              disabled={recorderState === 'idle'}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 text-white disabled:opacity-30"
              aria-label="Arrêter l'enregistrement"
            >
              <Square size={20} fill="white" />
            </button>
          )}

          {/* Centre : Play/Pause */}
          <button
            onClick={onPlayPause}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-gray-900 shadow-lg active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>

          {/* Droite : Quitter (les deux modes) */}
          <button
            onClick={onQuit}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white"
            aria-label="Quitter"
          >
            <X size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingControls;
