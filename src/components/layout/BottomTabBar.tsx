import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { List, History, Receipt, BarChart3 } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactElement;
}

interface BottomTabBarProps {}

export const BottomTabBar = ({}: BottomTabBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: Tab[] = [
    {
      id: 'lists',
      label: 'Listas',
      path: '/home',
      icon: (active: boolean) => (
        <List
          className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'stats',
      label: 'Estatísticas',
      path: '/stats',
      icon: (active: boolean) => (
        <BarChart3
          className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'history',
      label: 'Histórico',
      path: '/history',
      icon: (active: boolean) => (
        <History
          className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'scan',
      label: 'Escanear',
      path: '/scanner',
      icon: (active: boolean) => (
        <Receipt
          className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
  ];

  const handleTabClick = (tab: Tab) => {
    // Haptic feedback (se disponível)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    navigate(tab.path);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <div
        className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/20 rounded-full shadow-lg max-w-sm w-full overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Estilo Liquid Glass: ocupa toda região disponível */}
        <div className="flex items-stretch justify-center h-16 px-1 py-1 relative gap-0.5">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
              >
                {/* Fundo Liquid Glass - ocupa 100% da região */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-2xl"
                    style={{
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-1 relative z-10 py-1.5"
                >
                  {/* Ícone */}
                  <div className="relative">
                    {tab.icon(isActive)}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
