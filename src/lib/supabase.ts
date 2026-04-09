import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ALLOWED_DOMAIN = 'invox.fr';

export function isAllowedEmail(email: string | undefined): boolean {
  return !!email && email.endsWith(`@${ALLOWED_DOMAIN}`);
}
