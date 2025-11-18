// src/hooks/useSupabaseLists.ts
// Hook OTIMIZADO para gerenciar listas usando APENAS Supabase (sem IndexedDB)
// ✅ Agora integrado com contexto de cache

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLists } from '../contexts/ListsContext';
import type { Database } from '../types/database';

type ShoppingListInsert = Database['public']['Tables']['shopping_lists']['Insert'];

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useSupabaseLists = () => {
  const { user } = useAuth();
  const [error, setError] = useState<Error | null>(null);

  // ✅ Usar contexto de cache ao invés de estado local
  const { lists: cachedLists, loading, fetchLists, invalidate, updateListInCache, removeListFromCache } = useLists();

  // Converter listas do cache para formato compatível
  const lists: ShoppingList[] = cachedLists.map(list => ({
    id: list.id,
    name: list.name,
    createdAt: new Date(list.created_at || list.createdAt),
    updatedAt: new Date(list.updated_at || list.updatedAt),
  }));

  // Criar nova lista
  const createList = async (name: string): Promise<ShoppingList> => {
    if (!user) {
      const error = new Error('Usuário não autenticado. Por favor, faça login.');
      console.error('[useSupabaseLists] User not authenticated:', { user, loading });
      throw error;
    }

    try {
      console.log('[useSupabaseLists] Creating list:', name, 'for user:', user.id);

      const newList: ShoppingListInsert = {
        user_id: user.id,
        name,
      };

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert(newList)
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseLists] Error creating list:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        });
        throw new Error(`Failed to create list: ${error.message}`);
      }

      console.log('[useSupabaseLists] List created:', data);

      const createdList: ShoppingList = {
        id: data.id,
        name: data.name,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // ✅ Invalidar cache para forçar refetch
      invalidate();
      await fetchLists(true);

      return createdList;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Atualizar lista
  const updateList = async (id: string, updates: { name?: string }): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('[useSupabaseLists] Updating list:', id, updates);

      const { error } = await supabase
        .from('shopping_lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseLists] Error updating list:', error);
        throw error;
      }

      // ✅ Atualizar no cache (otimista)
      updateListInCache(id, {
        ...updates,
        updated_at: new Date().toISOString(),
        updatedAt: new Date(),
      } as any);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Deletar lista
  const deleteList = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('[useSupabaseLists] Deleting list:', id);

      // Deletar itens primeiro (cascade deve fazer isso automaticamente, mas por garantia)
      await supabase
        .from('shopping_items')
        .delete()
        .eq('list_id', id);

      // Deletar lista
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseLists] Error deleting list:', error);
        throw error;
      }

      // ✅ Remover do cache
      removeListFromCache(id);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Buscar lista por ID
  const getListById = async (id: string): Promise<ShoppingList | undefined> => {
    if (!user) {
      console.warn('[useSupabaseLists] User not authenticated for getListById');
      return undefined;
    }

    try {
      // Primeiro tenta buscar como lista própria
      const { data: ownList } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      // Se encontrou a lista própria, retornar
      if (ownList) {
        return {
          id: ownList.id,
          name: ownList.name,
          createdAt: new Date(ownList.created_at),
          updatedAt: new Date(ownList.updated_at),
        };
      }

      // Se não encontrou, tenta buscar como lista compartilhada
      const { data: membership } = await supabase
        .from('list_members')
        .select(`
          list_id,
          shopping_lists (*)
        `)
        .eq('list_id', id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (membership && membership.shopping_lists) {
        const sharedList = membership.shopping_lists as any;
        return {
          id: sharedList.id,
          name: sharedList.name,
          createdAt: new Date(sharedList.created_at),
          updatedAt: new Date(sharedList.updated_at),
        };
      }

      // Não encontrou a lista
      console.warn('[useSupabaseLists] List not found or access denied:', id);
      return undefined;
    } catch (err) {
      const error = err as Error;
      console.error('[useSupabaseLists] Error fetching list:', error);
      setError(error);
      return undefined; // Retorna undefined ao invés de lançar erro
    }
  };

  // Sair de uma lista compartilhada
  const leaveList = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('[useSupabaseLists] Leaving shared list:', id);

      // Marcar como inativo na tabela list_members
      const { error, data } = await supabase
        .from('list_members')
        .update({ is_active: false })
        .eq('list_id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[useSupabaseLists] Error leaving list:', error);
        throw error;
      }

      // Verificar se alguma linha foi atualizada
      if (!data || data.length === 0) {
        console.error('[useSupabaseLists] No rows updated - possible RLS policy issue or already left');
        throw new Error('Não foi possível sair da lista. Você pode não ter permissão ou já saiu desta lista.');
      }

      console.log('[useSupabaseLists] Successfully left list, rows updated:', data.length);

      // ✅ Invalidar cache e atualizar
      invalidate();
      await fetchLists(true);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    leaveList,
    getListById,
    refreshLists: () => fetchLists(true), // ✅ Force refresh do cache
  };
};
