// Synchronisation des scripts depuis Airtable via le token URL
import { AirtableLoadResponse } from '../types';

const PERSON_KEY = 'facecam_person';

export interface SyncResult {
  person: AirtableLoadResponse['person'];
  scripts: AirtableLoadResponse['scripts'];
}

export async function fetchScriptsFromToken(token: string): Promise<SyncResult> {
  const res = await fetch(`/api/load?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<SyncResult>;
}

export function savePerson(person: AirtableLoadResponse['person']): void {
  localStorage.setItem(PERSON_KEY, JSON.stringify(person));
}

export function loadPerson(): AirtableLoadResponse['person'] | null {
  try {
    const raw = localStorage.getItem(PERSON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
