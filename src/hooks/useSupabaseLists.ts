// src/hooks/useSupabaseLists.ts
// Hook para gerenciar listas usando APENAS Supabase (sem IndexedDB)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type ShoppingListRow = Database['public']['Tables']['shopping_lists']['Row'];
type ShoppingListInsert = Database['public']['Tables']['shopping_lists']['Insert'];

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useSupabaseLists = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar listas do Supabase
  const loadLists = async () => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[useSupabaseLists] Loading lists for user:', user.id);

      // Buscar listas próprias
      const { data: ownLists, error: ownError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('device_id', user.id)
        .order('updated_at', { ascending: false });

      if (ownError) {
        console.error('[useSupabaseLists] Error loading own lists:', ownError);
        throw ownError;
      }

      // Buscar listas compartilhadas (onde sou membro)
      const { data: memberships, error: memberError } = await supabase
        .from('list_members')
        .select(`
          list_id,
          shopping_lists (*)
        `)
        .eq('device_id', user.id)
        .eq('is_active', true);

      if (memberError) {
        console.error('[useSupabaseLists] Error loading shared lists:', memberError);
        // Não lançar erro, apenas logar
      }

      // Combinar listas próprias e compartilhadas
      const sharedLists = memberships
        ?.map((m: any) => m.shopping_lists)
        .filter(Boolean) || [];

      const allLists = [...(ownLists || []), ...sharedLists];

      console.log('[useSupabaseLists] Loaded lists:', allLists.length);

      // Converter para formato do frontend
      const formattedLists: ShoppingList[] = allLists.map((list: ShoppingListRow) => ({
        id: list.id,
        name: list.name,
        createdAt: new Date(list.created_at),
        updatedAt: new Date(list.updated_at),
      }));

      setLists(formattedLists);
      setError(null);
    } catch (err) {
      const error = err as Error;
      console.error('[useSupabaseLists] Error loading lists:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando o usuário mudar
  useEffect(() => {
    loadLists();
  }, [user?.id]);

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
        device_id: user.id,
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

      // Adicionar à lista local
      setLists([createdList, ...lists]);

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

      // Atualizar na lista local
      setLists(lists.map(list =>
        list.id === id
          ? { ...list, ...updates, updatedAt: new Date() }
          : list
      ));
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

      // Remover da lista local
      setLists(lists.filter(list => list.id !== id));
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Buscar lista por ID
  const getListById = async (id: string): Promise<ShoppingList | undefined> => {
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[useSupabaseLists] Error fetching list:', error);
        throw error;
      }

      if (!data) return undefined;

      return {
        id: data.id,
        name: data.name,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
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
    getListById,
    refreshLists: loadLists,
  };
};
