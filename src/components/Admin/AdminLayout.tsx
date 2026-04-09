import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Building2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  const isCompanies = location.pathname.startsWith('/admin/compan');
  const isContacts = location.pathname.startsWith('/admin/contact');

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <img src="/invox-logo.svg" alt="Invox" className="h-7" />
              <span className="text-gray-400 text-sm font-medium hidden sm:block">Admin FaceCam</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-invox-dark text-sm transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Déconnexion</span>
            </button>
          </div>
          {/* Nav tabs */}
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => navigate('/admin/companies')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isCompanies
                  ? 'border-invox-blue text-invox-blue'
                  : 'border-transparent text-gray-500 hover:text-invox-dark'
              }`}
            >
              <Building2 size={15} />
              Entreprises
            </button>
            <button
              onClick={() => navigate('/admin/contacts')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isContacts
                  ? 'border-invox-blue text-invox-blue'
                  : 'border-transparent text-gray-500 hover:text-invox-dark'
              }`}
            >
              <Users size={15} />
              Ambassadeurs
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
