// src/hooks/useListSuggestions.ts
// Hook para gerenciar sugestões sob demanda de itens para uma lista

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ShoppingItem } from './useSupabaseItems';

interface SuggestedItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

interface UseListSuggestionsReturn {
  suggestions: SuggestedItem[];
  loading: boolean;
  error: Error | null;
  fetchSuggestions: () => Promise<void>;
  dismissSuggestions: () => void;
  removeSuggestion: (suggestionName: string) => void;
}

const MIN_ITEMS_FOR_CONTEXT = 1; // Mínimo de itens para gerar sugestões

export const useListSuggestions = (
  listId: string | undefined,
  items: ShoppingItem[]
): UseListSuggestionsReturn => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref para prevenir chamadas simultâneas
  const isFetchingRef = useRef(false);

  /**
   * Busca sugestões da API (chamada sob demanda)
   */
  const fetchSuggestions = useCallback(async (): Promise<void> => {
    if (!user || !listId) {
      console.log('[useListSuggestions] Missing user or listId');
      return;
    }

    // Não buscar se a lista tem poucos itens (sem contexto suficiente)
    if (items.length < MIN_ITEMS_FOR_CONTEXT) {
      console.log('[useListSuggestions] Not enough items for context:', items.length);
      setError(new Error('Adicione pelo menos 1 item para receber sugestões'));
      return;
    }

    // Prevenir chamadas simultâneas
    if (isFetchingRef.current) {
      console.log('[useListSuggestions] Already fetching, skipping...');
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('[useListSuggestions] Fetching suggestions for list:', listId);

      // Criar contexto dos últimos itens adicionados
      const recentItems = items
        .slice(-5)
        .map(item => `${item.name} (${item.category || 'sem categoria'})`)
        .join(', ');

      const prompt = `Últimos itens adicionados: ${recentItems}. Sugira itens complementares que o usuário pode ter esquecido.`;

      // Enviar lista de todos os itens existentes para evitar duplicados
      const existingItems = items.map(item => item.name);

      const response = await fetch('/api/suggest-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          prompt,
          listType: 'sugestões complementares',
          maxResults: 5,
          existingItems
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch suggestions');
      }

      const data = await response.json();
      const fetchedSuggestions = data.items || [];

      console.log('[useListSuggestions] Received', fetchedSuggestions.length, 'suggestions');

      // Filtrar sugestões que já existem na lista
      const existingItemNames = new Set(
        items.map(item => item.name.toLowerCase().trim())
      );

      const filteredSuggestions = fetchedSuggestions.filter(
        (suggestion: SuggestedItem) =>
          !existingItemNames.has(suggestion.name.toLowerCase().trim())
      );

      console.log('[useListSuggestions] Filtered to', filteredSuggestions.length, 'new suggestions');

      // Atualizar estado com sugestões
      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('[useListSuggestions] Error fetching suggestions:', err);
      setError(err as Error);
      setSuggestions([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, listId, items]);

  /**
   * Descarta sugestões (usuário não quer ver)
   */
  const dismissSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  /**
   * Remove uma sugestão específica do array (quando usuário a adiciona)
   */
  const removeSuggestion = useCallback((suggestionName: string) => {
    setSuggestions(prev =>
      prev.filter(s => s.name.toLowerCase().trim() !== suggestionName.toLowerCase().trim())
    );
  }, []);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    dismissSuggestions,
    removeSuggestion
  };
};
