import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { List, History, Receipt } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  path?: string;
  action?: string;
  icon: (active: boolean) => React.ReactElement;
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
        <List
          className={`w-6 h-6 ${active ? 'text-primary' : 'text-gray-600'}`}
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
          className={`w-6 h-6 ${active ? 'text-primary' : 'text-gray-600'}`}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'scan',
      label: 'Escanear',
      action: 'scan',
      icon: (active: boolean) => (
        <Receipt
          className={`w-6 h-6 ${active ? 'text-primary' : 'text-gray-600'}`}
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

    if (tab.action === 'scan') {
      onScanClick?.();
    } else if (tab.path) {
      navigate(tab.path);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/20 rounded-2xl shadow-lg max-w-md w-full overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = tab.path ? location.pathname === tab.path : false;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1"
                >
                  {/* Fundo ativo */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl mx-2"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Ícone */}
                  <div className="relative z-10">
                    {tab.icon(isActive)}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[11px] font-medium transition-colors relative z-10 ${
                      isActive ? 'text-primary' : 'text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
