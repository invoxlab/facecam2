// Fonction serverless Vercel (Node runtime)
// Variables d'env requises : AIRTABLE_API_KEY, AIRTABLE_BASE_ID

import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Token manquant' }));
    return;
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Configuration serveur manquante' }));
    return;
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  try {
    // 1. Trouver le contact par son token
    const contactUrl = `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(`{Token}="${token}"`)}&maxRecords=1`;
    const contactRes = await fetch(contactUrl, { headers });

    if (!contactRes.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: `Erreur Airtable: ${contactRes.status}` }));
      return;
    }

    const contactData = await contactRes.json() as { records: AirtableRecord[] };

    if (!contactData.records?.length) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Token invalide ou inconnu' }));
      return;
    }

    const contact = contactData.records[0];
    const scriptIds: string[] = (contact.fields.Scripts as string[]) ?? [];

    // 2. Récupérer les scripts liés
    const scripts: AirtableScript[] = [];

    for (const scriptId of scriptIds) {
      const scriptRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Scripts/${scriptId}`,
        { headers }
      );
      if (!scriptRes.ok) continue;
      const s = await scriptRes.json() as AirtableRecord;
      scripts.push({
        airtableId: s.id,
        titre: String(s.fields.Titre ?? 'Sans titre'),
        script: String(s.fields.Script ?? ''),
        instructions: String(s.fields.Instructions ?? ''),
        ordre: Number(s.fields.Ordre ?? 0),
      });
    }

    scripts.sort((a, b) => a.ordre - b.ordre);

    res.statusCode = 200;
    res.end(JSON.stringify({
      person: {
        prenom: String(contact.fields['Prénom'] ?? contact.fields['Prenom'] ?? ''),
        nom: String(contact.fields.Nom ?? ''),
        email: String(contact.fields.Email ?? ''),
        fonction: String(contact.fields.Fonction ?? ''),
      },
      scripts,
    }));

  } catch (err) {
    console.error('Erreur API load:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Erreur serveur interne' }));
  }
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableScript {
  airtableId: string;
  titre: string;
  script: string;
  instructions: string;
  ordre: number;
}
