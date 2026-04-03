import { useState, useRef, useCallback } from 'react';
import { getMimeType } from './useCamera';
import { videoStore } from '../lib/videoStore';

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

interface UseMediaRecorderReturn {
  state: RecorderState;
  duration: number;
  start: (stream: MediaStream) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  error: string | null;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeType = getMimeType();

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback((stream: MediaStream) => {
    setError(null);
    chunksRef.current = [];

    try {
      const options: MediaRecorderOptions = {};
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, options);
      const actualMime = recorder.mimeType || mimeType;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: actualMime || 'video/webm',
        });
        console.log(`[Recorder] ${chunksRef.current.length} chunks — ${(finalBlob.size / 1024 / 1024).toFixed(1)} Mo`);
        // Le blob URL est créé et géré par videoStore (résistant au StrictMode)
        videoStore.set(finalBlob, actualMime || 'video/webm');
        setState('stopped');
        clearTimer();
      };

      recorder.onerror = (e) => {
        console.error('[Recorder] error', e);
        setError("Erreur d'enregistrement");
        setState('idle');
        clearTimer();
      };

      recorder.start(100); // chunk toutes les 100ms
      recorderRef.current = recorder;
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

    } catch (err) {
      console.error('[Recorder] start failed', err);
      setError(String(err));
    }
  }, [mimeType]);

  const pause = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      setState('paused');
      clearTimer();
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      setState('recording');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.requestData(); } catch {} // flush dernier chunk
      recorderRef.current.stop();
      clearTimer();
    }
  }, []);

  return { state, duration, start, pause, resume, stop, error };
}
