import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isAllowedEmail } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate('/admin/login', { replace: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) navigate('/admin/login', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-invox-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session && !isAllowedEmail(session.user.email)) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center gap-4 px-8">
        <p className="text-red-500 font-semibold text-lg">Accès refusé</p>
        <p className="text-gray-500 text-sm text-center">
          Seuls les comptes @invox.fr sont autorisés.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-invox-blue text-sm font-medium"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
