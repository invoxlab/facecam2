// API admin — liste contacts + création
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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
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

  const apiKey = process.env.AIRTABLE_API_KEY!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const airtableHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // ────────────────────────────────────────────────────────────────────────────
  // GET — liste tous les contacts avec progression
  // ────────────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      // Fetch all contacts
      const contactsRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts?pageSize=100`,
        { headers: airtableHeaders }
      );
      if (!contactsRes.ok) throw new Error(`Airtable contacts: ${contactsRes.status}`);
      const contactsData = await contactsRes.json() as { records: AirtableRecord[] };

      // Fetch all scripts (to count statuses)
      const scriptsRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Scripts?fields[]=Contact&fields[]=Statut&pageSize=100`,
        { headers: airtableHeaders }
      );
      const scriptsData = scriptsRes.ok
        ? (await scriptsRes.json() as { records: AirtableRecord[] })
        : { records: [] };

      // Group scripts by contact
      const scriptCountByContact: Record<string, { total: number; validated: number }> = {};
      for (const s of scriptsData.records) {
        const contacts = (s.fields.Contact as string[]) ?? [];
        for (const cId of contacts) {
          if (!scriptCountByContact[cId]) scriptCountByContact[cId] = { total: 0, validated: 0 };
          scriptCountByContact[cId].total++;
          if (String(s.fields.Statut ?? '') === 'Validé') scriptCountByContact[cId].validated++;
        }
      }

      const contacts = contactsData.records.map((c) => ({
        id: c.id,
        prenom: String(c.fields['Prénom'] ?? c.fields['Prenom'] ?? ''),
        nom: String(c.fields.Nom ?? ''),
        email: String(c.fields.Email ?? ''),
        fonction: String(c.fields.Fonction ?? ''),
        token: String(c.fields.Token ?? ''),
        scriptCount: scriptCountByContact[c.id]?.total ?? 0,
        validatedCount: scriptCountByContact[c.id]?.validated ?? 0,
      }));

      res.statusCode = 200;
      res.end(JSON.stringify({ contacts }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST — créer contact + scripts, ou ajouter script, ou supprimer script
  // ────────────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const bodyStr = await readBody(req);
      const body = JSON.parse(bodyStr) as PostBody;

      // Ajouter un script à un contact existant
      if (body.action === 'add-script') {
        const s = body.script!;
        const scriptRes = await fetch(
          `https://api.airtable.com/v0/${baseId}/Scripts`,
          {
            method: 'POST',
            headers: airtableHeaders,
            body: JSON.stringify({
              records: [{
                fields: {
                  Titre: s.titre,
                  Script: s.script,
                  Instructions: s.instructions,
                  Ordre: s.ordre,
                  Statut: 'À tourner',
                  Contact: [body.contactId],
                },
              }],
            }),
          }
        );
        if (!scriptRes.ok) {
          const e = await scriptRes.json() as { error?: { message?: string } };
          throw new Error(e.error?.message ?? `Script create: ${scriptRes.status}`);
        }
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // Supprimer un script
      if (body.action === 'delete-script') {
        await fetch(
          `https://api.airtable.com/v0/${baseId}/Scripts/${body.scriptId}`,
          { method: 'DELETE', headers: airtableHeaders }
        );
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // Créer un contact + ses scripts
      const contactRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts`,
        {
          method: 'POST',
          headers: airtableHeaders,
          body: JSON.stringify({
            records: [{
              fields: {
                'Prénom': body.prenom,
                Nom: body.nom,
                Email: body.email,
                Mobile: body.mobile,
                Fonction: body.fonction,
              },
            }],
          }),
        }
      );
      if (!contactRes.ok) {
        const e = await contactRes.json() as { error?: { message?: string } };
        throw new Error(e.error?.message ?? `Contact create: ${contactRes.status}`);
      }
      const contactData = await contactRes.json() as { records: AirtableRecord[] };
      const contactId = contactData.records[0].id;

      // Créer les scripts liés
      const scripts = body.scripts ?? [];
      for (const s of scripts) {
        await fetch(
          `https://api.airtable.com/v0/${baseId}/Scripts`,
          {
            method: 'POST',
            headers: airtableHeaders,
            body: JSON.stringify({
              records: [{
                fields: {
                  Titre: s.titre,
                  Script: s.script,
                  Instructions: s.instructions,
                  Ordre: s.ordre,
                  Statut: 'À tourner',
                  Contact: [contactId],
                },
              }],
            }),
          }
        );
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ contactId }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Méthode non supportée' }));
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface ScriptInput {
  titre: string;
  script: string;
  instructions: string;
  ordre: number;
}

interface PostBody {
  action?: 'add-script' | 'delete-script';
  // create contact
  prenom?: string;
  nom?: string;
  email?: string;
  mobile?: string;
  fonction?: string;
  scripts?: ScriptInput[];
  // add-script
  contactId?: string;
  script?: ScriptInput;
  // delete-script
  scriptId?: string;
}
