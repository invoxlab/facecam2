import { useState, useEffect, useRef } from 'react';
import { VideoFormat } from '../types';

export type CameraError =
  | 'permission-denied'
  | 'not-found'
  | 'not-supported'
  | 'unknown';

interface UseCameraReturn {
  stream: MediaStream | null;
  error: CameraError | null;
  isLoading: boolean;
  isSupported: boolean;
  isRecorderSupported: boolean;
  retry: () => void;
}

function detectCameraError(err: unknown): CameraError {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'permission-denied';
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return 'not-found';
    }
  }
  return 'unknown';
}

export function getMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function useCamera(format: VideoFormat = 'landscape'): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const isRecorderSupported = typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    if (!isSupported) {
      setError('not-supported');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const start = async () => {
      setIsLoading(true);
      setError(null);

      // Arrêter le stream précédent
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      // Contraintes selon le format choisi
      const isPortrait = format === 'portrait';

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: isPortrait ? 1080 : 1920 },
            height: { ideal: isPortrait ? 1920 : 1080 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (!cancelled) {
          streamRef.current = mediaStream;
          setStream(mediaStream);
          setError(null);
        } else {
          mediaStream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        if (!cancelled) {
          setError(detectCameraError(err));
          setStream(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setStream(null);
    };
  }, [retryCount, isSupported, format]);

  const retry = () => setRetryCount(c => c + 1);

  return { stream, error, isLoading, isSupported, isRecorderSupported, retry };
}
