import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useState } from 'react';

interface PushOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal de onboarding para solicitar permissão de Push Notifications
 *
 * Exibido no primeiro login do usuário
 * Estilo iOS nativo
 */
export const PushOnboardingModal: React.FC<PushOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { requestPermission, loading, isSupported } = usePushNotifications();
  const [error, setError] = useState<string | null>(null);

  // Detectar iOS e se está instalado
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore
    (window.navigator as any).standalone === true;

  const handleAllow = async () => {
    setError(null);
    const success = await requestPermission();

    if (success) {
      onSuccess?.();
      onClose();
    } else {
      setError('Não foi possível ativar as notificações. Verifique as permissões do navegador.');
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
              {/* Header com ícone */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={handleSkip}
                  className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h2 className="text-[22px] font-bold text-center text-gray-900 dark:text-white mb-2">
                  Ativar Notificações
                </h2>

                <p className="text-[15px] text-center text-gray-600 dark:text-gray-400 leading-relaxed">
                  Receba avisos quando alguém atualizar suas listas compartilhadas. Você pode desativar a qualquer momento.
                </p>
              </div>

              {/* Benefícios */}
              <div className="px-6 pb-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                      Fique sincronizado
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                      Saiba quando alguém adicionar ou marcar itens
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                      Notificações instantâneas
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                      Receba avisos mesmo com o app fechado
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 dark:text-purple-400 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                      Controle total
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                      Desative quando quiser nas configurações
                    </p>
                  </div>
                </div>
              </div>

              {/* iOS Installation Warning */}
              {isIOS && !isStandalone && (
                <div className="mx-6 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-[13px] text-blue-600 dark:text-blue-400 text-center font-medium mb-1">
                    📱 Instale o app primeiro
                  </p>
                  <p className="text-[12px] text-blue-600 dark:text-blue-400 text-center">
                    No Safari, toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong> para ativar notificações.
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-[13px] text-red-600 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="p-6 pt-2 space-y-3">
                <button
                  onClick={handleAllow}
                  disabled={loading || !isSupported}
                  className="w-full h-12 bg-primary text-white rounded-ios text-[17px] font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? 'Ativando...' : !isSupported ? 'Instale o App Primeiro' : 'Permitir Notificações'}
                </button>

                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="w-full h-12 text-gray-600 dark:text-gray-400 text-[17px] font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  Agora Não
                </button>
              </div>

              {/* Footer info */}
              <div className="px-6 pb-6">
                <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
                  Suas notificações são privadas e seguras. Você pode gerenciá-las nas configurações do app ou do navegador.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
