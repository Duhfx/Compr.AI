// src/hooks/useDeviceId.ts
// Generate and persist unique device ID for anonymous authentication
// Or use userId when authenticated

import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

export const useDeviceId = (): string => {
  const [deviceId, setDeviceId] = useState<string>('');
  const { user, loading } = useAuth();

  useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      try {
        console.log('[useDeviceId] Auth state:', {
          user: user ? { id: user.id, email: user.email } : null,
          loading
        });

        // Wait for auth to finish loading
        if (loading) {
          console.log('[useDeviceId] Auth still loading, waiting...');
          return;
        }

        // If user is authenticated, use their user ID
        if (user) {
          console.log('[useDeviceId] Using authenticated user ID:', user.id);
          setDeviceId(user.id);
          return;
        }

        console.log('[useDeviceId] No authenticated user, using anonymous device ID');

        // Otherwise, use anonymous device ID
        const devices = await db.userDevice.toArray();

        if (devices.length > 0) {
          console.log('[useDeviceId] Found existing device ID:', devices[0].userId);
          setDeviceId(devices[0].userId);
        } else {
          // Create new device ID
          const newDeviceId = crypto.randomUUID();
          console.log('[useDeviceId] Creating new device ID:', newDeviceId);

          await db.userDevice.add({
            userId: newDeviceId,
            nickname: `Dispositivo ${new Date().toLocaleDateString()}`,
            lastSyncAt: new Date()
          });

          setDeviceId(newDeviceId);
        }
      } catch (error) {
        console.error('[useDeviceId] Error loading device ID:', error);
      }
    };

    loadOrCreateDeviceId();
  }, [user, loading]);

  return deviceId;
};
