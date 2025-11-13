// src/lib/sharing.ts
// Funções utilitárias para compartilhamento de listas

import { supabase } from './supabase';
import { db } from './db';
import type { Database } from '../types/database';

type SharedListInsert = Database['public']['Tables']['shared_lists']['Insert'];
type ListMemberInsert = Database['public']['Tables']['list_members']['Insert'];

/**
 * Gera um código de compartilhamento único de 6 caracteres
 */
export const generateShareCode = (): string => {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
};

/**
 * Cria um link de compartilhamento para uma lista
 */
export const createShareLink = async (
  listId: string,
  deviceId: string,
  permission: 'edit' | 'readonly' = 'edit',
  expiresInDays?: number
): Promise<{ shareCode: string; shareUrl: string }> => {
  let shareCode = generateShareCode();
  let attempts = 0;
  const maxAttempts = 5;

  // Garantir que o código seja único
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('shared_lists')
      .select('id')
      .eq('share_code', shareCode)
      .single();

    if (!existing) break;

    shareCode = generateShareCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique share code');
  }

  // Calcular data de expiração (se fornecida)
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Inserir no Supabase
  const { data, error } = await supabase
    .from('shared_lists')
    .insert({
      list_id: listId,
      share_code: shareCode,
      owner_user_id: deviceId, // Changed from owner_device_id
      permission,
      expires_at: expiresAt,
    } as SharedListInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating share link:', error);
    throw error;
  }

  // Salvar localmente
  await db.sharedLists.add({
    id: data.id,
    listId: data.list_id,
    shareCode: data.share_code,
    ownerDeviceId: data.owner_user_id, // Changed from owner_device_id
    permission: data.permission,
    createdAt: new Date(data.created_at),
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
  });

  // Gerar URL completa
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/join/${shareCode}`;

  return { shareCode, shareUrl };
};

/**
 * Valida e busca informações de um código de compartilhamento
 */
export const validateShareCode = async (code: string) => {
  const { data, error } = await supabase
    .from('shared_lists')
    .select(`
      *,
      shopping_lists (
        id,
        name,
        created_at,
        updated_at
      )
    `)
    .eq('share_code', code.toUpperCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { valid: false, error: 'Código inválido' };
    }
    return { valid: false, error: 'Erro ao validar código' };
  }

  // Verificar se expirou
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Código expirado' };
    }
  }

  return {
    valid: true,
    data: {
      listId: data.list_id,
      listName: (data.shopping_lists as any).name,
      permission: data.permission,
      ownerDeviceId: data.owner_user_id, // Changed from owner_device_id
    },
  };
};

/**
 * Adiciona um dispositivo como membro de uma lista compartilhada
 */
export const joinSharedList = async (code: string, deviceId: string) => {
  // Validar código
  const validation = await validateShareCode(code);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { listId, listName, permission } = validation.data!;

  // Verificar se já é membro
  const { data: existingMember } = await supabase
    .from('list_members')
    .select('id')
    .eq('list_id', listId)
    .eq('user_id', deviceId) // Changed from device_id
    .single();

  if (existingMember) {
    // Reativar se estava inativo
    await supabase
      .from('list_members')
      .update({ is_active: true })
      .eq('id', existingMember.id);
  } else {
    // Adicionar como novo membro
    const { error: memberError } = await supabase
      .from('list_members')
      .insert({
        list_id: listId,
        user_id: deviceId, // Changed from device_id
        is_active: true,
      } as ListMemberInsert);

    if (memberError) {
      console.error('Error adding member:', memberError);
      throw memberError;
    }
  }

  // Buscar dados completos da lista
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', listId)
    .single();

  if (listError) {
    console.error('Error fetching list:', listError);
    throw listError;
  }

  // Salvar lista localmente
  await db.shoppingLists.add({
    id: list.id,
    name: list.name,
    createdAt: new Date(list.created_at),
    updatedAt: new Date(list.updated_at),
    syncedAt: new Date(),
    isLocal: false,
  });

  // Buscar e salvar itens da lista
  const { data: items } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('list_id', listId);

  if (items) {
    for (const item of items) {
      await db.shoppingItems.add({
        id: item.id,
        listId: item.list_id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || undefined,
        checked: item.checked,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      });
    }
  }

  return {
    listId,
    listName,
    permission,
    itemCount: items?.length || 0,
  };
};

/**
 * Remove um membro de uma lista compartilhada
 */
export const leaveSharedList = async (listId: string, deviceId: string) => {
  // Marcar como inativo ao invés de deletar (mantém histórico)
  const { error } = await supabase
    .from('list_members')
    .update({ is_active: false })
    .eq('list_id', listId)
    .eq('user_id', deviceId) // Changed from device_id;

  if (error) {
    console.error('Error leaving list:', error);
    throw error;
  }

  // Remover dados locais
  await db.shoppingItems.where('listId').equals(listId).delete();
  await db.shoppingLists.delete(listId);
};

/**
 * Busca informações do dono da lista
 */
export const getListOwner = async (listId: string) => {
  // Buscar o dono através da tabela shared_lists
  const { data: sharedList } = await supabase
    .from('shared_lists')
    .select('owner_user_id')
    .eq('list_id', listId)
    .maybeSingle();

  if (sharedList?.owner_user_id) {
    return sharedList.owner_user_id;
  }

  // Se não for compartilhada, buscar o user_id da própria lista
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('user_id')
    .eq('id', listId)
    .single();

  return list?.user_id || null;
};

/**
 * Busca membros ativos de uma lista com informações do usuário
 */
export const getListMembers = async (listId: string) => {
  const { data: members, error } = await supabase
    .from('list_members')
    .select('*')
    .eq('list_id', listId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    throw error;
  }

  if (!members || members.length === 0) {
    return [];
  }

  // Retornar apenas os IDs e datas
  // Nota: Como usamos Supabase Auth no client, não temos acesso às informações
  // completas dos usuários. Apenas retornamos o user_id.
  return members.map((member) => ({
    id: member.id,
    userId: member.user_id,
    joinedAt: new Date(member.joined_at),
    lastSeenAt: member.last_seen_at ? new Date(member.last_seen_at) : undefined,
  }));
};

/**
 * Remove um membro de uma lista compartilhada (apenas o dono pode fazer isso)
 */
export const removeMember = async (listId: string, memberUserId: string, currentUserId: string) => {
  // Verificar se o usuário atual é o dono
  const ownerId = await getListOwner(listId);

  if (ownerId !== currentUserId) {
    throw new Error('Apenas o dono da lista pode remover membros');
  }

  // Não permitir que o dono se remova
  if (memberUserId === currentUserId) {
    throw new Error('Você não pode se remover da própria lista');
  }

  // Marcar como inativo
  const { error } = await supabase
    .from('list_members')
    .update({ is_active: false })
    .eq('list_id', listId)
    .eq('user_id', memberUserId);

  if (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

/**
 * Atualiza o timestamp de última visualização de um membro
 */
export const updateLastSeen = async (listId: string, deviceId: string) => {
  await supabase
    .from('list_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('list_id', listId)
    .eq('user_id', deviceId) // Changed from device_id;
};

/**
 * Verifica se uma lista é compartilhada
 */
export const isSharedList = async (listId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('shared_lists')
    .select('id')
    .eq('list_id', listId)
    .single();

  return !!data;
};

/**
 * Busca informações de compartilhamento de uma lista
 */
export const getShareInfo = async (listId: string) => {
  const { data } = await supabase
    .from('shared_lists')
    .select('*')
    .eq('list_id', listId)
    .single();

  if (!data) return null;

  return {
    shareCode: data.share_code,
    permission: data.permission,
    createdAt: new Date(data.created_at),
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    shareUrl: `${window.location.origin}/join/${data.share_code}`,
  };
};

/**
 * Revoga um link de compartilhamento (deleta o share code)
 */
export const revokeShareLink = async (listId: string) => {
  const { error } = await supabase
    .from('shared_lists')
    .delete()
    .eq('list_id', listId);

  if (error) {
    console.error('Error revoking share link:', error);
    throw error;
  }

  // Remover localmente
  await db.sharedLists.where('listId').equals(listId).delete();
};
