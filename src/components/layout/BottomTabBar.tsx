import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt, History } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  path?: string;
  action?: string;
  icon: (active: boolean) => React.ReactElement;
  isCenter?: boolean;
}

interface BottomTabBarProps {
  onScanClick?: () => void;
}

export const BottomTabBar = ({ onScanClick }: BottomTabBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: Tab[] = [
    {
      id: 'lists',
      label: 'Listas',
      path: '/home',
      icon: (active: boolean) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-6 h-6 ${active ? 'text-primary' : 'text-gray-500'}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 0 : 2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      id: 'scan',
      label: 'Escanear',
      action: 'scan',
      isCenter: true,
      icon: () => (
        <Receipt className="w-7 h-7 text-white" strokeWidth={2.5} />
      ),
    },
    {
      id: 'history',
      label: 'Histórico',
      path: '/history',
      icon: (active: boolean) => (
        <History className={`w-6 h-6 ${active ? 'text-primary' : 'text-gray-500'}`} strokeWidth={active ? 2.5 : 2} />
      ),
    },
  ];

  const handleTabClick = (tab: Tab) => {
    // Haptic feedback (se disponível)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    if (tab.action === 'scan') {
      onScanClick?.();
    } else if (tab.path) {
      navigate(tab.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 safe-bottom z-50">
      <div className="flex items-center justify-around h-16 relative">
        {tabs.map((tab) => {
          const isActive = tab.path ? location.pathname === tab.path : false;

          // Botão central especial (Escanear)
          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                {/* Botão circular elevado */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="absolute -top-4 w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-full shadow-lg flex items-center justify-center group-active:shadow-xl transition-shadow"
                >
                  {tab.icon(false)}
                  {/* Brilho sutil */}
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity" />
                </motion.div>
                <span className="text-[10px] mt-8 font-medium text-gray-600">
                  {tab.label}
                </span>
              </button>
            );
          }

          // Tabs normais (Listas e Histórico)
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center flex-1 h-full relative haptic-light"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center"
              >
                {tab.icon(isActive)}
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </motion.div>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
