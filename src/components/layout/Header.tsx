import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export const Header = () => {
  const { isOffline } = useOfflineStatus();

  return (
    <header className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Compr.AI</h1>
            {isOffline && (
              <span className="text-xs bg-warning text-white px-2 py-1 rounded-full">
                Offline
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
