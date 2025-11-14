// src/hooks/useListsWithStats.ts
// Hook para gerenciar listas com estatísticas de itens

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type ShoppingListRow = Database['public']['Tables']['shopping_lists']['Row'];

export interface ListWithStats {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  totalItems: number;
  checkedItems: number;
  uncheckedItems: number;
}

export const useListsWithStats = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<ListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar listas com stats
  const loadListsWithStats = useCallback(async () => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[useListsWithStats] Loading lists with stats for user:', user.id);

      // Buscar listas próprias
      const { data: ownLists, error: ownError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (ownError) {
        console.error('[useListsWithStats] Error loading own lists:', ownError);
        throw ownError;
      }

      // Buscar listas compartilhadas (onde sou membro)
      const { data: memberships, error: memberError } = await supabase
        .from('list_members')
        .select(`
          list_id,
          shopping_lists (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (memberError) {
        console.error('[useListsWithStats] Error loading shared lists:', memberError);
      }

      // Combinar listas próprias e compartilhadas (remover duplicatas)
      const sharedLists = memberships
        ?.map((m: any) => m.shopping_lists)
        .filter(Boolean) || [];

      // Usar Map para garantir unicidade por ID
      const listsMap = new Map<string, ShoppingListRow>();

      // Adicionar listas próprias primeiro (prioridade)
      (ownLists || []).forEach(list => listsMap.set(list.id, list));

      // Adicionar listas compartilhadas (não sobrescreve se já existe)
      sharedLists.forEach((list: ShoppingListRow) => {
        if (!listsMap.has(list.id)) {
          listsMap.set(list.id, list);
        }
      });

      const allLists = Array.from(listsMap.values());

      // Buscar stats de itens para todas as listas
      const listIds = allLists.map((list: ShoppingListRow) => list.id);

      const { data: items, error: itemsError } = await supabase
        .from('shopping_items')
        .select('list_id, checked')
        .in('list_id', listIds);

      if (itemsError) {
        console.error('[useListsWithStats] Error loading items stats:', itemsError);
      }

      // Calcular stats por lista
      const statsMap = new Map<string, { total: number; checked: number }>();

      items?.forEach(item => {
        const current = statsMap.get(item.list_id) || { total: 0, checked: 0 };
        statsMap.set(item.list_id, {
          total: current.total + 1,
          checked: item.checked ? current.checked + 1 : current.checked,
        });
      });

      // Converter para formato do frontend com stats
      const formattedLists: ListWithStats[] = allLists.map((list: ShoppingListRow) => {
        const stats = statsMap.get(list.id) || { total: 0, checked: 0 };
        return {
          id: list.id,
          name: list.name,
          createdAt: new Date(list.created_at),
          updatedAt: new Date(list.updated_at),
          totalItems: stats.total,
          checkedItems: stats.checked,
          uncheckedItems: stats.total - stats.checked,
        };
      });

      console.log('[useListsWithStats] Loaded lists with stats:', formattedLists.length);
      setLists(formattedLists);
      setError(null);
    } catch (err) {
      const error = err as Error;
      console.error('[useListsWithStats] Error loading lists:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Recarregar quando o usuário mudar
  useEffect(() => {
    loadListsWithStats();
  }, [loadListsWithStats]);

  return {
    lists,
    loading,
    error,
    refreshLists: loadListsWithStats,
  };
};
