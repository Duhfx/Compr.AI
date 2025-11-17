import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { ListWithStats } from '../types';

interface ListsContextType {
  lists: ListWithStats[];
  loading: boolean;
  lastFetch: Date | null;
  fetchLists: (force?: boolean) => Promise<void>;
  invalidate: () => void;
  updateListInCache: (listId: string, updates: Partial<ListWithStats>) => void;
  removeListFromCache: (listId: string) => void;
}

const ListsContext = createContext<ListsContextType | null>(null);

const STALE_TIME = 30000; // 30 segundos - dados são considerados frescos por 30s
const BACKGROUND_REFETCH_TIME = 5000; // 5 segundos - refetch em background após navegação

export const ListsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lists, setLists] = useState<ListWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const { user } = useAuth();

  const fetchLists = useCallback(async (force = false) => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    // ✅ Verificar se dados estão frescos (cache hit)
    if (!force && lastFetch && (Date.now() - lastFetch.getTime()) < STALE_TIME) {
      console.log('[ListsContext] Cache hit - usando dados em memória');
      return;
    }

    // ✅ Se já tem dados, recarrega em background (sem loading)
    const isBackgroundRefetch = lists.length > 0 && !force;

    if (!isBackgroundRefetch) {
      setLoading(true);
    } else {
      console.log('[ListsContext] Background refetch iniciado');
    }

    try {
      // Query 1: Buscar listas próprias
      const { data: ownLists, error: ownError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (ownError) throw ownError;

      // Query 2: Buscar listas compartilhadas
      const { data: memberships, error: memberError } = await supabase
        .from('list_members')
        .select(`
          list_id,
          shopping_lists!inner (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (memberError) throw memberError;

      // Combinar listas
      const allLists = [
        ...(ownLists || []),
        ...(memberships?.map((m: any) => m.shopping_lists) || [])
      ].filter((list, index, self) =>
        index === self.findIndex((l) => l.id === list.id)
      );

      // Se não tem listas, retornar array vazio
      if (allLists.length === 0) {
        setLists([]);
        setLastFetch(new Date());
        return;
      }

      const listIds = allLists.map(list => list.id);

      // Query 3: Buscar contagem de itens (otimizado)
      const { data: items, error: itemsError } = await supabase
        .from('shopping_items')
        .select('list_id, checked')
        .in('list_id', listIds);

      if (itemsError) throw itemsError;

      // Calcular estatísticas
      const listsWithStats: ListWithStats[] = allLists.map((list) => {
        const listItems = items?.filter(item => item.list_id === list.id) || [];
        const totalItems = listItems.length;
        const checkedItems = listItems.filter(item => item.checked).length;
        const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

        return {
          ...list,
          totalItems,
          checkedItems,
          progress
        };
      });

      setLists(listsWithStats);
      setLastFetch(new Date());

      console.log(`[ListsContext] ${isBackgroundRefetch ? 'Background refetch' : 'Fetch'} completo - ${listsWithStats.length} listas carregadas`);
    } catch (error) {
      console.error('[ListsContext] Erro ao carregar listas:', error);

      // Se falhar e não tiver dados, limpar
      if (!isBackgroundRefetch) {
        setLists([]);
      }
      // Se falhar no background refetch, manter dados antigos
    } finally {
      if (!isBackgroundRefetch) {
        setLoading(false);
      }
    }
  }, [user, lastFetch, lists.length]);

  // Invalidar cache (forçar próximo fetch)
  const invalidate = useCallback(() => {
    console.log('[ListsContext] Cache invalidado');
    setLastFetch(null);
  }, []);

  // Atualizar lista específica no cache (otimização)
  const updateListInCache = useCallback((listId: string, updates: Partial<ListWithStats>) => {
    setLists(prevLists =>
      prevLists.map(list =>
        list.id === listId ? { ...list, ...updates } : list
      )
    );
    console.log(`[ListsContext] Lista ${listId} atualizada no cache`);
  }, []);

  // Remover lista do cache (otimização)
  const removeListFromCache = useCallback((listId: string) => {
    setLists(prevLists => prevLists.filter(list => list.id !== listId));
    console.log(`[ListsContext] Lista ${listId} removida do cache`);
  }, []);

  // Fetch inicial quando usuário logado
  useEffect(() => {
    if (user) {
      fetchLists(false);
    } else {
      setLists([]);
      setLastFetch(null);
    }
  }, [user?.id]);

  // Background refetch periódico quando está em foco
  useEffect(() => {
    if (!user || lists.length === 0) return;

    const interval = setInterval(() => {
      // Só faz refetch se a aba estiver em foco
      if (!document.hidden && lastFetch) {
        const timeSinceLastFetch = Date.now() - lastFetch.getTime();
        if (timeSinceLastFetch > BACKGROUND_REFETCH_TIME) {
          fetchLists(false); // Background refetch
        }
      }
    }, BACKGROUND_REFETCH_TIME);

    return () => clearInterval(interval);
  }, [user, lists.length, lastFetch, fetchLists]);

  return (
    <ListsContext.Provider
      value={{
        lists,
        loading,
        lastFetch,
        fetchLists,
        invalidate,
        updateListInCache,
        removeListFromCache
      }}
    >
      {children}
    </ListsContext.Provider>
  );
};

export const useLists = () => {
  const context = useContext(ListsContext);
  if (!context) {
    throw new Error('useLists deve ser usado dentro de ListsProvider');
  }
  return context;
};
