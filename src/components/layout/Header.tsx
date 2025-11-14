import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, User } from 'lucide-react';
import { useState } from 'react';
import { UserProfileModal } from '../user/UserProfileModal';

export const Header = () => {
  const { isOffline } = useOfflineStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Always show app name
  const getTitle = () => {
    return 'Compr.AI';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setShowMenu(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleOpenProfile = () => {
    setShowMenu(false);
    setShowProfileModal(true);
  };

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-primary/10 dark:border-indigo-500/20 sticky top-0 z-10 safe-top transition-all shadow-sm">
      <div className="flex items-center justify-between h-14 px-5">
        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">
            {getTitle()}
          </h1>
          {isOffline && (
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" title="Offline" />
          )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-3 relative">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-gray-600 dark:text-gray-300 bg-gray-100/70 dark:bg-gray-700/50 hover:bg-gray-200/80 dark:hover:bg-gray-600/60 backdrop-blur-sm rounded-full active:scale-95 transition-all shadow-sm"
            title={`Mudar para modo ${resolvedTheme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {user ? (
            <>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2.5 text-primary dark:text-indigo-400 bg-primary/10 dark:bg-indigo-500/20 hover:bg-primary/20 dark:hover:bg-indigo-500/30 backdrop-blur-sm rounded-full active:scale-95 transition-all shadow-sm"
                title={user.email}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-20 overflow-hidden">
                    <div className="p-4 border-b border-gray-100/50 dark:border-gray-700/50 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Conectado como</p>
                      <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={handleOpenProfile}
                      className="w-full px-4 py-3 text-left text-[15px] font-medium text-gray-900 dark:text-white hover:bg-gray-100/70 dark:hover:bg-gray-700/50 active:bg-gray-200/70 dark:active:bg-gray-600/50 flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-[15px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 active:bg-red-100/70 dark:active:bg-red-900/30 border-t border-gray-100/50 dark:border-gray-700/50 transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="p-2.5 text-primary dark:text-indigo-400 bg-primary/10 dark:bg-indigo-500/20 hover:bg-primary/20 dark:hover:bg-indigo-500/30 backdrop-blur-sm rounded-full active:scale-95 transition-all shadow-sm"
              title="Fazer login"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};
