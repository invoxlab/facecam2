// Fonction serverless Vercel — charge les scripts depuis Airtable
// Variables d'env requises : AIRTABLE_API_KEY, AIRTABLE_BASE_ID

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'Token manquant' }, { status: 400 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    return Response.json({ error: 'Configuration serveur manquante' }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  // 1. Trouver le contact par son token
  const contactUrl = `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(`{Token}="${token}"`)}&maxRecords=1`;
  const contactRes = await fetch(contactUrl, { headers });

  if (!contactRes.ok) {
    return Response.json({ error: 'Erreur Airtable' }, { status: 502 });
  }

  const contactData = await contactRes.json() as { records: AirtableRecord[] };

  if (!contactData.records?.length) {
    return Response.json({ error: 'Token invalide ou inconnu' }, { status: 404 });
  }

  const contact = contactData.records[0];
  const scriptIds: string[] = contact.fields.Scripts ?? [];

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

  const response = {
    person: {
      prenom: String(contact.fields.Prénom ?? ''),
      nom: String(contact.fields.Nom ?? ''),
      email: String(contact.fields.Email ?? ''),
      fonction: String(contact.fields.Fonction ?? ''),
    },
    scripts,
  };

  return Response.json(response, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

// Types internes
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
