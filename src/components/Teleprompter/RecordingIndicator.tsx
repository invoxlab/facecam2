import { useEffect, useState } from 'react';

interface RecordingIndicatorProps {
  duration: number; // secondes
  isPaused: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const RecordingIndicator = ({ duration, isPaused }: RecordingIndicatorProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isPaused) { setVisible(true); return; }
    const interval = setInterval(() => setVisible(v => !v), 600);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.1s' }}
      />
      <span className="text-white text-sm font-mono font-medium">
        {formatDuration(duration)}
      </span>
      {isPaused && (
        <span className="text-yellow-400 text-xs font-medium ml-1">PAUSE</span>
      )}
    </div>
  );
};

export default RecordingIndicator;
