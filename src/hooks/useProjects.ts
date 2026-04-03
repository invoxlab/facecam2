import { useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';

export function useProjects(spaceId: string) {
  const store = useProjectStore();

  useEffect(() => {
    if (spaceId) store.loadProjects(spaceId);
  }, [spaceId]);

  return store;
}

export function useProject(id: string | undefined) {
  const store = useProjectStore();

  useEffect(() => {
    if (id) store.loadProject(id);
  }, [id]);

  return {
    project: store.currentProject,
    isLoading: store.isLoading,
    updateProject: store.updateProject,
    updateSettings: store.updateSettings,
    validateProject: store.validateProject,
    deleteProject: store.deleteProject,
  };
}
