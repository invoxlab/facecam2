// API admin — liste entreprises + création
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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; });
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
  if (!auth.ok) { res.statusCode = 401; res.end(JSON.stringify({ error: auth.error })); return; }

  const apiKey = process.env.AIRTABLE_API_KEY!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  // GET — liste toutes les entreprises avec count ambassadeurs
  if (req.method === 'GET') {
    try {
      const [companiesRes, contactsRes] = await Promise.all([
        fetch(`https://api.airtable.com/v0/${baseId}/Entreprises?pageSize=100`, { headers }),
        fetch(`https://api.airtable.com/v0/${baseId}/Contacts?fields[]=Entreprise&pageSize=100`, { headers }),
      ]);

      if (!companiesRes.ok) throw new Error(`Airtable companies: ${companiesRes.status}`);
      const companiesData = await companiesRes.json() as { records: AirtableRecord[] };

      const contactCountByCompany: Record<string, number> = {};
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json() as { records: AirtableRecord[] };
        for (const c of contactsData.records) {
          const linked = (c.fields.Entreprise as string[]) ?? [];
          for (const cId of linked) {
            contactCountByCompany[cId] = (contactCountByCompany[cId] ?? 0) + 1;
          }
        }
      }

      const companies = companiesData.records.map((c) => ({
        id: c.id,
        nom: String(c.fields.Nom ?? ''),
        statut: String(c.fields.Statut ?? ''),
        smm: String(c.fields['Social Media Manager'] ?? ''),
        ambassadeurCount: contactCountByCompany[c.id] ?? 0,
      }));

      res.statusCode = 200;
      res.end(JSON.stringify({ companies }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  // POST — créer une entreprise
  if (req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req)) as { nom: string; statut?: string; smm?: string };

      const createRes = await fetch(`https://api.airtable.com/v0/${baseId}/Entreprises`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          records: [{
            fields: {
              Nom: body.nom,
              ...(body.statut ? { Statut: body.statut } : {}),
              ...(body.smm ? { 'Social Media Manager': body.smm } : {}),
            },
          }],
        }),
      });

      if (!createRes.ok) {
        const e = await createRes.json() as { error?: { message?: string } };
        throw new Error(e.error?.message ?? `Create: ${createRes.status}`);
      }
      const data = await createRes.json() as { records: AirtableRecord[] };
      res.statusCode = 200;
      res.end(JSON.stringify({ companyId: data.records[0].id }));
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
