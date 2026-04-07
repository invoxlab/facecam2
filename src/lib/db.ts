import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, StoredVideo } from '../types';

interface TelePromptDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-updatedAt': number;
      'by-spaceId': string;
    };
  };
  videos: {
    key: string; // projectId
    value: StoredVideo;
  };
}

const DB_NAME = 'teleprompt-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<TelePromptDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TelePromptDB>(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          const store = database.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('by-updatedAt', 'updatedAt');
        }
        if (oldVersion < 2) {
          // Migration : ajouter index spaceId sur projects existants
          if (!database.objectStoreNames.contains('videos')) {
            database.createObjectStore('videos', { keyPath: 'projectId' });
          }
          // Note : on ne peut pas ajouter un index à un store existant dans le même upgrade
          // sans le recréer — on gère spaceId côté applicatif pour la v2
        }
      },
    });
  }
  return dbPromise;
}

export const db = {
  async getAllProjects(): Promise<Project[]> {
    const database = await getDB();
    const projects = await database.getAllFromIndex('projects', 'by-updatedAt');
    return projects.reverse();
  },

  async getProjectsBySpace(spaceId: string): Promise<Project[]> {
    const database = await getDB();
    const all = await database.getAllFromIndex('projects', 'by-updatedAt');
    return all
      .filter(p => (p.spaceId ?? 'default') === spaceId)
      .reverse();
  },

  async getProject(id: string): Promise<Project | undefined> {
    const database = await getDB();
    return database.get('projects', id);
  },

  async saveProject(project: Project): Promise<void> {
    const database = await getDB();
    await database.put('projects', project);
  },

  async deleteProject(id: string): Promise<void> {
    const database = await getDB();
    await database.delete('projects', id);
    // Supprimer la vidéo associée si elle existe
    try { await database.delete('videos', id); } catch {}
  },

  // Vidéos validées
  async saveVideo(video: StoredVideo): Promise<void> {
    const database = await getDB();
    await database.put('videos', video);
  },

  async getVideo(projectId: string): Promise<StoredVideo | undefined> {
    const database = await getDB();
    return database.get('videos', projectId);
  },

  async deleteVideo(projectId: string): Promise<void> {
    const database = await getDB();
    await database.delete('videos', projectId);
  },
};
