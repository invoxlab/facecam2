export type VideoFormat = 'portrait' | 'landscape';
export type ProjectStatus = 'to-record' | 'validated';

export interface ProjectSettings {
  scrollSpeed: number;
  fontSize: number;
  textPosition: 'top' | 'center' | 'bottom';
  textOpacity: number;
  mirrorCamera: boolean;
  wordsPerMinute: number;
  videoFormat: VideoFormat;
}

export const DEFAULT_SETTINGS: ProjectSettings = {
  scrollSpeed: 5,
  fontSize: 28,
  textPosition: 'center',
  textOpacity: 0.75,
  mirrorCamera: true,
  wordsPerMinute: 150,
  videoFormat: 'landscape',
};

export interface Project {
  id: string;
  spaceId: string;          // identifiant de l'espace utilisateur (slug dans l'URL)
  name: string;
  script: string;
  settings: ProjectSettings;
  status: ProjectStatus;    // 'to-record' | 'validated'
  validatedAt?: number;     // timestamp de validation
  videoDuration?: number;   // durée en secondes (rempli à la validation)
  videoSize?: number;       // taille en octets (rempli à la validation)
  createdAt: number;
  updatedAt: number;
}

export interface StoredVideo {
  projectId: string;
  blob: Blob;
  mimeType: string;
  recordedAt: number;
}

export type RecordingMode = 'rehearse' | 'record';
