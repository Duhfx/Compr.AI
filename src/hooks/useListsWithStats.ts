// src/hooks/useListsWithStats.ts
// Hook OTIMIZADO para gerenciar listas com estatísticas de itens
// ✅ Agora usa contexto de cache para evitar recarregamentos desnecessários

import { useLists } from '../contexts/ListsContext';

export interface ListWithStats {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  totalItems: number;
  checkedItems: number;
  uncheckedItems: number;
  progress?: number;
}

export const useListsWithStats = () => {
  // ✅ Usar contexto de cache - dados persistem entre navegações
  const { lists, loading, fetchLists } = useLists();

  // Formatar listas para incluir uncheckedItems (compatibilidade)
  const formattedLists: ListWithStats[] = lists.map(list => ({
    ...list,
    uncheckedItems: list.totalItems - list.checkedItems,
    createdAt: new Date(list.created_at || list.createdAt),
    updatedAt: new Date(list.updated_at || list.updatedAt),
  }));

  return {
    lists: formattedLists,
    loading,
    error: null, // Contexto gerencia erros internamente
    refreshLists: () => fetchLists(true), // Force refresh
  };
};
