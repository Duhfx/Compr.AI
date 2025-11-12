// src/hooks/useDeviceId.ts
// Generate and persist unique device ID for anonymous authentication
// Or use userId when authenticated

import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

export const useDeviceId = (): string => {
  const [deviceId, setDeviceId] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      try {
        // If user is authenticated, use their user ID
        if (user) {
          setDeviceId(user.id);
          return;
        }

        // Otherwise, use anonymous device ID
        const devices = await db.userDevice.toArray();

        if (devices.length > 0) {
          setDeviceId(devices[0].deviceId);
        } else {
          // Create new device ID
          const newDeviceId = crypto.randomUUID();

          await db.userDevice.add({
            deviceId: newDeviceId,
            nickname: `Dispositivo ${new Date().toLocaleDateString()}`,
            lastSyncAt: new Date()
          });

          setDeviceId(newDeviceId);
        }
      } catch (error) {
        console.error('Error loading device ID:', error);
      }
    };

    loadOrCreateDeviceId();
  }, [user]);

  return deviceId;
};
