// src/hooks/useUserProfile.ts
// Hook para gerenciar perfil do usuário (nickname, avatar, etc.)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useDeviceId } from './useDeviceId';

export interface UserProfile {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (nickname: string, avatarUrl?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const deviceId = useDeviceId();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar perfil do Supabase
  const loadProfile = useCallback(async () => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar perfil no Supabase
      const { data, error: supabaseError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', deviceId)
        .single();

      if (supabaseError) {
        // Se não encontrou o perfil, pode ser que ainda não foi criado
        if (supabaseError.code === 'PGRST116') {
          console.log('Perfil não encontrado no Supabase, será criado no primeiro update');
          setProfile(null);
        } else {
          throw supabaseError;
        }
      } else if (data) {
        // Perfil encontrado
        const profileData: UserProfile = {
          userId: data.user_id,
          nickname: data.nickname,
          avatarUrl: data.avatar_url || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };

        setProfile(profileData);

        // Atualizar IndexedDB local também
        await db.userDevice.update(deviceId, {
          nickname: data.nickname,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Carregar perfil quando o deviceId estiver disponível
  useEffect(() => {
    if (deviceId) {
      loadProfile();
    }
  }, [deviceId, loadProfile]);

  // Atualizar perfil
  const updateProfile = async (nickname: string, avatarUrl?: string) => {
    if (!deviceId) {
      throw new Error('Device ID não disponível');
    }

    if (!nickname || nickname.trim().length === 0) {
      throw new Error('Nome não pode estar vazio');
    }

    try {
      setLoading(true);
      setError(null);

      const trimmedNickname = nickname.trim();

      // Verificar se perfil já existe
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', deviceId)
        .single();

      if (existingProfile) {
        // Atualizar perfil existente
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            nickname: trimmedNickname,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', deviceId);

        if (updateError) throw updateError;
      } else {
        // Criar novo perfil
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: deviceId,
            nickname: trimmedNickname,
            avatar_url: avatarUrl || null,
          });

        if (insertError) throw insertError;
      }

      // Atualizar IndexedDB local
      await db.userDevice.update(deviceId, {
        nickname: trimmedNickname,
      });

      // Recarregar perfil
      await loadProfile();

      console.log('Perfil atualizado com sucesso:', trimmedNickname);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: loadProfile,
  };
};
