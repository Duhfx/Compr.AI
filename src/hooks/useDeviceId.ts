// src/hooks/useDeviceId.ts
// Generate and persist unique device ID for anonymous authentication

import { useState, useEffect } from 'react';
import { db } from '../lib/db';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      try {
        // Try to get existing device ID from IndexedDB
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
      } finally {
        setLoading(false);
      }
    };

    loadOrCreateDeviceId();
  }, []);

  return { deviceId, loading };
};
