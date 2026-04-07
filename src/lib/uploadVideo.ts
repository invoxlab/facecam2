// Upload d'une vidéo vers Supabase Storage
// Retourne l'URL publique du fichier

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const BUCKET = 'videos';

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadVideoToSupabase(
  blob: Blob,
  airtableId: string,
  mimeType: string
): Promise<UploadResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase non configuré');
  }

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const timestamp = Date.now();
  const path = `${airtableId}-${timestamp}.${ext}`;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: blob,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload Supabase échoué: ${err}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

  return { url: publicUrl, path };
}

export async function notifyAirtableValidated(
  airtableId: string,
  videoUrl: string,
  duration: number,
  size: number
): Promise<void> {
  const res = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ airtableId, videoUrl, duration, size }),
  });

  if (!res.ok) {
    console.warn('Airtable non mis à jour:', await res.text());
  }
}
