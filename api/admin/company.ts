// API admin — détail entreprise + ses ambassadeurs
import type { IncomingMessage, ServerResponse } from 'http';

const ALLOWED_DOMAIN = 'invox.fr';

async function verifyAdmin(req: IncomingMessage): Promise<{ ok: boolean; error?: string }> {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '').trim();
  if (!token) return { ok: false, error: 'Token manquant' };
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: supabaseKey },
  });
  if (!res.ok) return { ok: false, error: 'Session invalide' };
  const user = await res.json() as { email?: string };
  if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) return { ok: false, error: 'Accès non autorisé' };
  return { ok: true };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end('{}'); return; }

  const auth = await verifyAdmin(req);
  if (!auth.ok) { res.statusCode = 401; res.end(JSON.stringify({ error: auth.error })); return; }

  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  if (!id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id manquant' })); return; }

  const apiKey = process.env.AIRTABLE_API_KEY!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const airtableHeaders = { Authorization: `Bearer ${apiKey}` };

  try {
    // 1. Fetch company
    const companyRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Entreprises/${id}`,
      { headers: airtableHeaders }
    );
    if (!companyRes.ok) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Entreprise introuvable' }));
      return;
    }
    const company = await companyRes.json() as AirtableRecord;

    // 2. Fetch all contacts + scripts in parallel
    const [contactsRes, scriptsRes] = await Promise.all([
      fetch(`https://api.airtable.com/v0/${baseId}/Contacts?pageSize=100`, { headers: airtableHeaders }),
      fetch(`https://api.airtable.com/v0/${baseId}/Scripts?fields[]=Contact&fields[]=Statut&pageSize=100`, { headers: airtableHeaders }),
    ]);

    const contactsData = contactsRes.ok
      ? (await contactsRes.json() as { records: AirtableRecord[] })
      : { records: [] };

    // Filter contacts linked to this company
    const ambassadeurs = contactsData.records.filter((c) => {
      const linked = (c.fields.Entreprise as string[]) ?? [];
      return linked.includes(id);
    });

    // Count scripts per contact
    const scriptCountByContact: Record<string, { total: number; validated: number }> = {};
    if (scriptsRes.ok) {
      const scriptsData = await scriptsRes.json() as { records: AirtableRecord[] };
      for (const s of scriptsData.records) {
        const contacts = (s.fields.Contact as string[]) ?? [];
        for (const cId of contacts) {
          if (!scriptCountByContact[cId]) scriptCountByContact[cId] = { total: 0, validated: 0 };
          scriptCountByContact[cId].total++;
          if (String(s.fields.Statut ?? '') === 'Validé') scriptCountByContact[cId].validated++;
        }
      }
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      id: company.id,
      nom: String(company.fields.Nom ?? ''),
      statut: String(company.fields.Statut ?? ''),
      smm: String(company.fields['Social Media Manager'] ?? ''),
      ambassadeurs: ambassadeurs.map((c) => ({
        id: c.id,
        prenom: String(c.fields['Prénom'] ?? c.fields['Prenom'] ?? ''),
        nom: String(c.fields.Nom ?? ''),
        fonction: String(c.fields.Fonction ?? ''),
        token: String(c.fields.Token ?? ''),
        scriptCount: scriptCountByContact[c.id]?.total ?? 0,
        validatedCount: scriptCountByContact[c.id]?.validated ?? 0,
      })),
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
