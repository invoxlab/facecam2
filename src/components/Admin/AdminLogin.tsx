import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isAllowedEmail } from '../../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && isAllowedEmail(data.session.user.email)) {
        navigate('/admin/contacts', { replace: true });
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/contacts`,
        queryParams: { hd: 'invox.fr' }, // hint Google Workspace domain
      },
    });
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img src="/invox-logo.svg" alt="Invox" className="h-10 mb-6" />
          <h1 className="text-2xl font-bold text-invox-dark">FaceCam Admin</h1>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Accès réservé à l'équipe Invox
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium text-sm hover:border-invox-blue hover:text-invox-blue transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          Se connecter avec Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Seuls les comptes @invox.fr sont acceptés
        </p>
      </div>
    </div>
  );
}
