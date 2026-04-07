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
  spaceId: string;
  name: string;
  script: string;
  instructions?: string;
  airtableId?: string;
  settings: ProjectSettings;
  status: ProjectStatus;
  validatedAt?: number;
  videoDuration?: number;
  videoSize?: number;
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

export interface AirtableLoadResponse {
  person: {
    prenom: string;
    nom: string;
    email: string;
    fonction: string;
  };
  scripts: {
    airtableId: string;
    titre: string;
    script: string;
    instructions: string;
    ordre: number;
  }[];
}
