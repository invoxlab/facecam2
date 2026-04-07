// Met à jour un script Airtable : Statut = "Validé" + URL de la vidéo
import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
    return;
  }

  // Lire le body
  const body = await new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  let payload: { airtableId?: string; videoUrl?: string; duration?: number; size?: number };
  try {
    payload = JSON.parse(body);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Body invalide' }));
    return;
  }

  const { airtableId, videoUrl, duration, size } = payload;

  if (!airtableId) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'airtableId manquant' }));
    return;
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Configuration serveur manquante' }));
    return;
  }

  try {
    const fields: Record<string, unknown> = { Statut: 'Validé' };
    if (videoUrl) fields['Vidéo'] = videoUrl;
    if (duration) fields['Durée (s)'] = Math.round(duration);
    if (size) fields['Poids (Mo)'] = Math.round(size / (1024 * 1024) * 10) / 10;

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Scripts/${airtableId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Airtable PATCH error:', err);
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Erreur mise à jour Airtable' }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('Erreur validate:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Erreur serveur' }));
  }
}
