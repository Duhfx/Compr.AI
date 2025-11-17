import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PushOnboardingModal } from './PushOnboardingModal';

const STORAGE_KEY = 'push-onboarding-shown';

/**
 * Gerenciador de Push Notifications
 *
 * Responsável por:
 * - Mostrar modal de onboarding no primeiro login
 * - Controlar quando solicitar permissão
 * - Armazenar estado de onboarding no localStorage
 */
export const PushNotificationsManager = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Só mostrar se:
    // 1. Usuário está autenticado
    // 2. Ainda não mostrou o modal (localStorage)
    // 3. Ainda não tem permissão concedida
    if (user) {
      const hasShownOnboarding = localStorage.getItem(STORAGE_KEY);
      const hasPermission = Notification.permission === 'granted';

      if (!hasShownOnboarding && !hasPermission) {
        // Aguardar 1 segundo para não ser intrusivo
        const timer = setTimeout(() => {
          setShowModal(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleClose = () => {
    setShowModal(false);
    // Marcar que já mostrou o onboarding
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleSuccess = () => {
    console.log('[PushNotificationsManager] Usuário ativou notificações');
    // Marcar que já mostrou o onboarding
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <PushOnboardingModal
      isOpen={showModal}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
};
