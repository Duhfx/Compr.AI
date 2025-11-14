import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const { isOffline } = useOfflineStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  // Simple title based on route
  const getTitle = () => {
    if (location.pathname.startsWith('/list/')) return 'Lista';
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

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-150 dark:border-gray-700 sticky top-0 z-10 safe-top transition-colors">
      <div className="flex items-center justify-between h-11 px-4">
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">
            {getTitle()}
          </h1>
          {isOffline && (
            <div className="w-2 h-2 bg-warning rounded-full" title="Offline" />
          )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-2 relative">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full active:opacity-70 transition-colors"
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
                className="p-1.5 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full active:opacity-70 transition-colors"
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
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-ios shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-[13px] text-gray-500 dark:text-gray-400">Conectado como</p>
                      <p className="text-[15px] font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-[15px] text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
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
              className="p-1.5 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full active:opacity-70 transition-colors"
              title="Fazer login"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
