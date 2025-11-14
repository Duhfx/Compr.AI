// src/hooks/useDeviceId.ts
// Returns authenticated user ID from Supabase Auth
// Returns empty string if user is not authenticated

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useDeviceId = (): string => {
  const [deviceId, setDeviceId] = useState<string>('');
  const { user, loading } = useAuth();

  useEffect(() => {
    const loadUserId = async () => {
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

        // Only authenticated users have an ID
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
        } else {
          // No authenticated user - return empty string
          console.log('[useDeviceId] No authenticated user - returning empty string');
          setDeviceId('');
        }
      } catch (error) {
        console.error('[useDeviceId] Error loading user ID:', error);
      }
    };

    loadUserId();
  }, [user, loading]);

  return deviceId;
};
