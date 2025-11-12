import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useLocation } from 'react-router-dom';

export const Header = () => {
  const { isOffline } = useOfflineStatus();
  const location = useLocation();

  // Simple title based on route
  const getTitle = () => {
    if (location.pathname.startsWith('/list/')) return 'Lista';
    return 'Compr.AI';
  };

  return (
    <header className="bg-white border-b border-gray-150 sticky top-0 z-10 safe-top">
      <div className="flex items-center justify-between h-11 px-4">
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <h1 className="text-[17px] font-semibold text-gray-900">
            {getTitle()}
          </h1>
          {isOffline && (
            <div className="w-2 h-2 bg-warning rounded-full" title="Offline" />
          )}
        </div>

        <div className="flex-1" />
      </div>
    </header>
  );
};
