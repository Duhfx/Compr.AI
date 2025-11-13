import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface ActionSheetOption {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  gradient?: boolean;
  variant?: 'default' | 'danger';
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
}

export const ActionSheet = ({ isOpen, onClose, options }: ActionSheetProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-40 z-50"
          />

          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-screen-sm mx-auto"
          >
            <div className="bg-white rounded-t-[20px] shadow-ios-lg pb-safe">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Options */}
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        option.onClick();
                        onClose();
                      }}
                      className={`
                        w-full h-14 rounded-ios text-[17px] font-semibold
                        flex items-center justify-center gap-3
                        active:scale-[0.98] transition-all
                        ${option.gradient
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                          : option.variant === 'danger'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-gray-100 text-gray-900'
                        }
                      `}
                    >
                      <span className={option.gradient ? 'text-white' : 'text-current'}>
                        {option.icon}
                      </span>
                      {option.label}
                    </button>
                  ))}

                  {/* Cancel Button */}
                  <button
                    onClick={onClose}
                    className="w-full h-14 rounded-ios text-[17px] font-semibold bg-white border-2 border-gray-200 text-gray-900 active:bg-gray-50 transition-colors mt-3"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
