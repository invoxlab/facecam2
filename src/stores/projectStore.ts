import { create } from 'zustand';
import { Project, ProjectSettings, DEFAULT_SETTINGS } from '../types';
import { db } from '../lib/db';

function generateId(): string {
  return crypto.randomUUID();
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;

  loadProjects: (spaceId: string) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (name: string, spaceId: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>;
  updateSettings: (id: string, settings: Partial<ProjectSettings>) => Promise<void>;
  validateProject: (id: string, meta: { duration: number; size: number }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  loadProjects: async (spaceId: string) => {
    set({ isLoading: true });
    try {
      const projects = await db.getProjectsBySpace(spaceId);
      set({ projects, isLoading: false });
    } catch (err) {
      console.error('Erreur chargement projets:', err);
      set({ isLoading: false });
    }
  },

  loadProject: async (id: string) => {
    set({ isLoading: true });
    try {
      const project = await db.getProject(id);
      set({ currentProject: project ?? null, isLoading: false });
    } catch (err) {
      console.error('Erreur chargement projet:', err);
      set({ isLoading: false });
    }
  },

  createProject: async (name: string, spaceId: string) => {
    const now = Date.now();
    const project: Project = {
      id: generateId(),
      spaceId,
      name: name.trim() || 'Nouveau projet',
      script: '',
      settings: { ...DEFAULT_SETTINGS },
      status: 'to-record',
      createdAt: now,
      updatedAt: now,
    };
    await db.saveProject(project);
    set(state => ({ projects: [project, ...state.projects] }));
    return project;
  },

  updateProject: async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    const { projects, currentProject } = get();
    const existing = projects.find(p => p.id === id) ?? currentProject;
    if (!existing) return;
    const updated: Project = { ...existing, ...updates, updatedAt: Date.now() };
    await db.saveProject(updated);
    set(state => ({
      projects: state.projects.map(p => p.id === id ? updated : p),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },

  updateSettings: async (id: string, settings: Partial<ProjectSettings>) => {
    const { projects, currentProject } = get();
    const existing = projects.find(p => p.id === id) ?? currentProject;
    if (!existing) return;
    const updated: Project = {
      ...existing,
      settings: { ...existing.settings, ...settings },
      updatedAt: Date.now(),
    };
    await db.saveProject(updated);
    set(state => ({
      projects: state.projects.map(p => p.id === id ? updated : p),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },

  validateProject: async (id: string, meta: { duration: number; size: number }) => {
    const { projects, currentProject } = get();
    const existing = projects.find(p => p.id === id) ?? currentProject;
    if (!existing) return;
    const updated: Project = {
      ...existing,
      status: 'validated',
      validatedAt: Date.now(),
      videoDuration: meta.duration,
      videoSize: meta.size,
      updatedAt: Date.now(),
    };
    await db.saveProject(updated);
    set(state => ({
      projects: state.projects.map(p => p.id === id ? updated : p),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },

  deleteProject: async (id: string) => {
    await db.deleteProject(id);
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  duplicateProject: async (id: string) => {
    const { projects, currentProject } = get();
    const source = projects.find(p => p.id === id) ?? currentProject;
    if (!source) throw new Error('Projet introuvable');
    const now = Date.now();
    const copy: Project = {
      ...source,
      id: generateId(),
      name: `${source.name} (copie)`,
      status: 'to-record',
      validatedAt: undefined,
      videoDuration: undefined,
      videoSize: undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.saveProject(copy);
    set(state => ({ projects: [copy, ...state.projects] }));
    return copy;
  },
}));
