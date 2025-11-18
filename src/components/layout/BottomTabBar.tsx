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
        className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200/20 rounded-full shadow-lg max-w-sm w-full overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Estilo WhatsApp: compacto e arredondado */}
        <div className="flex items-center justify-center h-14 px-2 py-2 relative gap-1">
          {tabs.map((tab, index) => {
            const isActive = location.pathname === tab.path;
            const isFirst = index === 0;
            const isLast = index === tabs.length - 1;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center justify-center relative"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-0.5 relative px-5 py-1.5"
                >
                  {/* Fundo arredondado completo (estilo WhatsApp) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 bg-gray-700 dark:bg-gray-700 ${
                        isFirst
                          ? 'rounded-l-full rounded-r-full -ml-2'
                          : isLast
                          ? 'rounded-r-full rounded-l-full -mr-2'
                          : 'rounded-full'
                      }`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Ícone */}
                  <div className="relative z-10">
                    {tab.icon(isActive)}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] font-medium transition-colors relative z-10 whitespace-nowrap ${
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
