// API admin — détail d'un contact
// Variables d'env : AIRTABLE_API_KEY, AIRTABLE_BASE_ID, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

import type { IncomingMessage, ServerResponse } from 'http';

const ALLOWED_DOMAIN = 'invox.fr';

async function verifyAdmin(req: IncomingMessage): Promise<{ ok: boolean; error?: string }> {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return { ok: false, error: 'Token manquant' };

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl) return { ok: false, error: 'Supabase non configuré' };

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseKey,
    },
  });

  if (!res.ok) return { ok: false, error: 'Session invalide' };
  const user = await res.json() as { email?: string };
  if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return { ok: false, error: 'Accès non autorisé' };
  }
  return { ok: true };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end('{}'); return; }

  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: auth.error }));
    return;
  }

  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const id = url.searchParams.get('id');

  if (!id) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Paramètre id manquant' }));
    return;
  }

  const apiKey = process.env.AIRTABLE_API_KEY!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const airtableHeaders = { Authorization: `Bearer ${apiKey}` };

  try {
    // 1. Fetch contact
    const contactRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
      { headers: airtableHeaders }
    );
    if (!contactRes.ok) {
      res.statusCode = contactRes.status === 404 ? 404 : 502;
      res.end(JSON.stringify({ error: `Contact introuvable (${contactRes.status})` }));
      return;
    }
    const contact = await contactRes.json() as AirtableRecord;
    const scriptIds: string[] = (contact.fields.Scripts as string[]) ?? [];

    // 2. Fetch linked scripts
    const scripts: ScriptDetail[] = [];
    for (const scriptId of scriptIds) {
      const sRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Scripts/${scriptId}`,
        { headers: airtableHeaders }
      );
      if (!sRes.ok) continue;
      const s = await sRes.json() as AirtableRecord;
      scripts.push({
        airtableId: s.id,
        titre: String(s.fields.Titre ?? 'Sans titre'),
        instructions: String(s.fields.Instructions ?? ''),
        ordre: Number(s.fields.Ordre ?? 0),
        validated: String(s.fields.Statut ?? '') === 'Validé',
        videoUrl: String(s.fields['Vidéo'] ?? ''),
      });
    }
    scripts.sort((a, b) => a.ordre - b.ordre);

    res.statusCode = 200;
    res.end(JSON.stringify({
      id: contact.id,
      prenom: String(contact.fields['Prénom'] ?? contact.fields['Prenom'] ?? ''),
      nom: String(contact.fields.Nom ?? ''),
      email: String(contact.fields.Email ?? ''),
      mobile: String(contact.fields.Mobile ?? ''),
      fonction: String(contact.fields.Fonction ?? ''),
      token: String(contact.fields.Token ?? ''),
      scripts,
    }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(err) }));
  }
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface ScriptDetail {
  airtableId: string;
  titre: string;
  instructions: string;
  ordre: number;
  validated: boolean;
  videoUrl: string;
}
