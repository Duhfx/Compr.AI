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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-screen-sm mx-auto">
          {children}
        </div>
      </main>
      {showTabBar && <BottomTabBar onScanClick={onScanClick} />}
    </div>
  );
};
