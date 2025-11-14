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
  userId: string,
  permission: 'edit' | 'readonly' = 'edit',
  expiresInDays?: number,
  singleUse: boolean = true
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
      owner_user_id: userId,
      permission,
      expires_at: expiresAt,
      single_use: singleUse,
      used: false,
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
    ownerUserId: data.owner_user_id,
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
  console.log('[validateShareCode] Validating code:', code.toUpperCase());

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
    .maybeSingle();

  console.log('[validateShareCode] Result:', { data, error });

  if (error) {
    console.error('[validateShareCode] Error:', error);
    return { valid: false, error: `Erro ao validar código: ${error.message}` };
  }

  if (!data) {
    console.warn('[validateShareCode] No data found for code:', code);
    return { valid: false, error: 'Código inválido ou não encontrado' };
  }

  // Verificar se já foi usado (apenas se for single-use)
  if (data.single_use === true && data.used === true) {
    console.warn('[validateShareCode] Single-use code already used:', code);
    return { valid: false, error: 'Este código já foi utilizado. Peça ao dono da lista para gerar um novo código.' };
  }

  // Verificar se expirou
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.warn('[validateShareCode] Code expired:', data.expires_at);
      return { valid: false, error: 'Código expirado' };
    }
  }

  console.log('[validateShareCode] Valid code:', {
    listId: data.list_id,
    listName: (data.shopping_lists as any)?.name,
  });

  return {
    valid: true,
    data: {
      listId: data.list_id,
      listName: (data.shopping_lists as any)?.name || 'Lista Compartilhada',
      permission: data.permission,
      ownerUserId: data.owner_user_id,
    },
  };
};

/**
 * Adiciona um usuário como membro de uma lista compartilhada
 */
export const joinSharedList = async (code: string, userId: string) => {
  // Validar código
  const validation = await validateShareCode(code);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { listId, listName, permission } = validation.data!;

  // Verificar se já é membro
  const { data: existingMember } = await supabase
    .from('list_members')
    .select('id, is_active')
    .eq('list_id', listId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    console.log('[joinSharedList] User is already a member:', { userId, listId, isActive: existingMember.is_active });

    // Reativar se estava inativo
    if (!existingMember.is_active) {
      console.log('[joinSharedList] Reactivating inactive member');
      await supabase
        .from('list_members')
        .update({ is_active: true })
        .eq('id', existingMember.id);
    }

    // Se já é membro ativo, apenas continua (não gera erro)
  } else {
    console.log('[joinSharedList] Adding new member:', { userId, listId });

    // Adicionar como novo membro
    const { error: memberError } = await supabase
      .from('list_members')
      .insert({
        list_id: listId,
        user_id: userId,
        is_active: true,
      } as ListMemberInsert);

    if (memberError) {
      console.error('Error adding member:', memberError);
      throw memberError;
    }

    // Marcar código como usado (apenas se for single-use)
    const { data: shareData } = await supabase
      .from('shared_lists')
      .select('single_use')
      .eq('share_code', code.toUpperCase())
      .maybeSingle();

    if (shareData?.single_use === true) {
      console.log('[joinSharedList] Marking single-use code as used:', code);
      await supabase
        .from('shared_lists')
        .update({
          used: true,
          used_at: new Date().toISOString(),
          used_by_user_id: userId,
        })
        .eq('share_code', code.toUpperCase());
    } else {
      console.log('[joinSharedList] Reusable code, not marking as used:', code);
    }
  }

  // Buscar dados completos da lista
  // Nota: Precisamos usar maybeSingle() ao invés de single() porque o RLS pode bloquear
  // Mas primeiro vamos verificar se o membro foi adicionado com sucesso
  console.log('[joinSharedList] Fetching list data for:', listId);

  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', listId)
    .maybeSingle();

  console.log('[joinSharedList] List fetch result:', { list, error: listError });

  if (listError) {
    console.error('Error fetching list:', listError);
    throw new Error(`Erro ao buscar lista: ${listError.message}`);
  }

  if (!list) {
    // Se não conseguiu buscar pelo Supabase (RLS), vamos buscar via shared_lists
    console.log('[joinSharedList] Direct fetch blocked by RLS, fetching via shared_lists');
    const { data: sharedData } = await supabase
      .from('shared_lists')
      .select(`
        *,
        shopping_lists (*)
      `)
      .eq('share_code', code.toUpperCase())
      .single();

    if (!sharedData || !sharedData.shopping_lists) {
      throw new Error('Lista não encontrada ou não acessível');
    }

    const listData = sharedData.shopping_lists as any;

    // Não precisamos salvar no IndexedDB - Supabase é a fonte da verdade
    // Os dados serão carregados diretamente do Supabase quando necessário

    // Buscar contagem de itens para retorno
    const { count: itemCount } = await supabase
      .from('shopping_items')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listData.id);

    return {
      listId: listData.id,
      listName: listData.name,
      permission,
      itemCount: itemCount || 0,
    };
  }

  // Não precisamos salvar no IndexedDB - Supabase é a fonte da verdade
  // Os dados serão carregados diretamente do Supabase quando necessário

  // Buscar contagem de itens para retorno
  const { count } = await supabase
    .from('shopping_items')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', listId);

  return {
    listId,
    listName,
    permission,
    itemCount: count || 0,
  };
};

/**
 * Remove um membro de uma lista compartilhada
 */
export const leaveSharedList = async (listId: string, userId: string) => {
  // Marcar como inativo ao invés de deletar (mantém histórico)
  const { error } = await supabase
    .from('list_members')
    .update({ is_active: false })
    .eq('list_id', listId)
    .eq('user_id', userId);

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
export const updateLastSeen = async (listId: string, userId: string) => {
  await supabase
    .from('list_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('list_id', listId)
    .eq('user_id', userId);
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
    singleUse: data.single_use ?? true, // Default to true for backward compatibility
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

/**
 * Verifica se o usuário é o dono da lista
 */
export const isListOwner = async (listId: string, userId: string): Promise<boolean> => {
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('user_id')
    .eq('id', listId)
    .single();

  return list?.user_id === userId;
};

/**
 * Busca a permissão do usuário na lista compartilhada
 * Retorna 'owner', 'edit', 'readonly' ou null se não tiver acesso
 */
export const getUserPermission = async (listId: string, userId: string): Promise<'owner' | 'edit' | 'readonly' | null> => {
  // Verificar se é o dono
  const owner = await isListOwner(listId, userId);
  if (owner) {
    return 'owner';
  }

  // Verificar se é membro através de compartilhamento
  const { data: member } = await supabase
    .from('list_members')
    .select('id')
    .eq('list_id', listId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!member) {
    return null;
  }

  // Buscar a permissão na tabela shared_lists
  const { data: sharedList } = await supabase
    .from('shared_lists')
    .select('permission')
    .eq('list_id', listId)
    .maybeSingle();

  return sharedList?.permission || 'edit';
};
