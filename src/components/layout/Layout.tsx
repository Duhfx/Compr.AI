import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';

interface LayoutProps {
  children: ReactNode;
  showTabBar?: boolean;
  onScanClick?: () => void;
}

export const Layout = ({ children, showTabBar = true, onScanClick }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col transition-colors overflow-x-hidden w-full">
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 w-full">
        <div className="max-w-screen-sm mx-auto w-full">
          {children}
        </div>
      </main>
      {showTabBar && <BottomTabBar onScanClick={onScanClick} />}
    </div>
  );
};
