import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gerenciar Push Notifications
 *
 * Funcionalidades:
 * - Verificar suporte do browser
 * - Solicitar permissão do usuário
 * - Registrar/remover subscription
 * - Salvar subscription no Supabase
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar suporte ao carregar
  useEffect(() => {
    const checkSupport = () => {
      // Verificar suporte básico
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      const hasNotification = 'Notification' in window;

      // iOS requer que o PWA esteja instalado (display-mode: standalone)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-ignore - iOS específico
        (window.navigator as any).standalone === true;

      // Detectar iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

      let supported = hasServiceWorker && hasPushManager && hasNotification;

      // No iOS, push só funciona em standalone mode (PWA instalado)
      if (isIOS && !isStandalone) {
        console.warn('[usePushNotifications] iOS detectado mas PWA não está instalado. Push não disponível.');
        supported = false;
      }

      console.log('[usePushNotifications] Verificação de suporte:', {
        hasServiceWorker,
        hasPushManager,
        hasNotification,
        isIOS,
        isStandalone,
        supported
      });

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Verificar se já está inscrito
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('[usePushNotifications] Erro ao verificar subscription:', err);
      }
    };

    checkSubscription();
  }, [isSupported]);

  /**
   * Converte base64 para Uint8Array (necessário para VAPID key)
   */
  const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray as Uint8Array<ArrayBuffer>;
  };

  /**
   * Solicita permissão e registra push subscription
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications não são suportadas neste navegador');
      return false;
    }

    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Solicitar permissão
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setError('Permissão de notificações negada');
        setLoading(false);
        return false;
      }

      // Registrar Service Worker e criar subscription
      const registration = await navigator.serviceWorker.ready;

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      console.log('[usePushNotifications] VAPID public key presente:', !!vapidPublicKey);

      if (!vapidPublicKey) {
        throw new Error('VAPID public key não configurada. Verifique se VITE_VAPID_PUBLIC_KEY está no .env.local');
      }

      console.log('[usePushNotifications] Service Worker registrado, criando subscription...');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('[usePushNotifications] Subscription criada com sucesso:', subscription);

      // Salvar subscription no Supabase
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          push_subscription: subscription.toJSON(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('[usePushNotifications] Subscription salva no Supabase');

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Erro ao registrar push:', err);

      let errorMessage = 'Erro ao ativar notificações';

      if (err instanceof Error) {
        // Mensagens específicas para erros comuns
        if (err.name === 'AbortError') {
          errorMessage = 'Falha ao registrar push. Verifique se a VAPID key está configurada corretamente.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Permissão negada. Habilite notificações nas configurações do navegador.';
        } else if (err.message.includes('VAPID')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, [isSupported, user]);

  /**
   * Remove subscription
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('[usePushNotifications] Unsubscribed from push');
      }

      // Remover do Supabase
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          push_subscription: null,
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] Erro ao desinscrever:', err);
      setError(err instanceof Error ? err.message : 'Erro ao desativar notificações');
      setLoading(false);
      return false;
    }
  }, [isSupported, user]);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    requestPermission,
    unsubscribe,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
  };
};
