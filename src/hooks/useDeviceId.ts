// src/hooks/useDeviceId.ts
// Generate and persist unique device ID for anonymous authentication
// Or use userId when authenticated

import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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

          // Check if profile exists in Supabase, create if not
          try {
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .single();

            if (!existingProfile) {
              // Create profile for authenticated user
              const defaultNickname = user.email?.split('@')[0] || `Usuário ${new Date().toLocaleDateString()}`;

              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: user.id,
                  nickname: defaultNickname,
                });

              if (profileError) {
                console.warn('[useDeviceId] Failed to create profile for authenticated user:', profileError);
              } else {
                console.log('[useDeviceId] Profile created for authenticated user');
              }
            }
          } catch (err) {
            console.warn('[useDeviceId] Error checking/creating profile for authenticated user:', err);
          }

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
          const defaultNickname = `Dispositivo ${new Date().toLocaleDateString()}`;
          console.log('[useDeviceId] Creating new device ID:', newDeviceId);

          // Save to IndexedDB
          await db.userDevice.add({
            userId: newDeviceId,
            nickname: defaultNickname,
            lastSyncAt: new Date()
          });

          // Create user profile in Supabase
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: newDeviceId,
                nickname: defaultNickname,
              });

            if (profileError) {
              console.warn('[useDeviceId] Failed to create profile in Supabase:', profileError);
            } else {
              console.log('[useDeviceId] Profile created in Supabase');
            }
          } catch (err) {
            console.warn('[useDeviceId] Error creating profile in Supabase:', err);
          }

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
