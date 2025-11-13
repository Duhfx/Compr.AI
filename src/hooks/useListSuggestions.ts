// src/hooks/useListSuggestions.ts
// Hook para gerenciar sugestões proativas de itens para uma lista

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/db';
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
  refreshSuggestions: () => Promise<void>;
  dismissSuggestions: () => void;
}

// Configurações de throttling
const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos
const DEBOUNCE_MS = 30 * 1000; // 30 segundos após mudanças
const MIN_ITEMS_FOR_CONTEXT = 2; // Mínimo de itens para gerar sugestões
const ITEMS_CHANGE_THRESHOLD = 3; // Recalcular após N novos itens

/**
 * Cria um hash simples dos nomes dos itens para detectar mudanças de contexto
 */
const createItemsHash = (items: ShoppingItem[]): string => {
  const lastFiveItems = items
    .slice(-5)
    .map(item => item.name.toLowerCase().trim())
    .sort()
    .join('|');

  // Hash simples (soma dos char codes)
  let hash = 0;
  for (let i = 0; i < lastFiveItems.length; i++) {
    const char = lastFiveItems.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

export const useListSuggestions = (
  listId: string | undefined,
  items: ShoppingItem[]
): UseListSuggestionsReturn => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs para evitar re-renders desnecessários
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastItemCount = useRef(0);
  const isFetchingRef = useRef(false);

  /**
   * Verifica se o cache é válido
   */
  const isCacheValid = useCallback(async (): Promise<boolean> => {
    if (!listId) return false;

    try {
      const cached = await db.listSuggestionCache.get(listId);
      if (!cached) return false;

      const age = Date.now() - cached.createdAt.getTime();
      const isExpired = age > CACHE_VALIDITY_MS;

      if (isExpired) {
        console.log('[useListSuggestions] Cache expired for list:', listId, '(age:', Math.round(age / 1000), 's)');
        return false;
      }

      // Verificar se o contexto mudou significativamente
      const currentHash = createItemsHash(items);
      const contextChanged = currentHash !== cached.lastItemNamesHash;

      if (contextChanged) {
        console.log('[useListSuggestions] Context changed for list:', listId);
        return false;
      }

      // Verificar se a quantidade de itens mudou muito
      const itemsDiff = Math.abs(items.length - cached.itemsCountWhenGenerated);
      const significantChange = itemsDiff >= ITEMS_CHANGE_THRESHOLD;

      if (significantChange) {
        console.log('[useListSuggestions] Significant item count change:', itemsDiff);
        return false;
      }

      console.log('[useListSuggestions] Using valid cache for list:', listId);
      return true;
    } catch (err) {
      console.error('[useListSuggestions] Error checking cache:', err);
      return false;
    }
  }, [listId, items]);

  /**
   * Busca sugestões da API
   */
  const fetchSuggestions = useCallback(async (): Promise<SuggestedItem[]> => {
    if (!user || !listId) {
      return [];
    }

    // Não buscar se a lista tem poucos itens (sem contexto suficiente)
    if (items.length < MIN_ITEMS_FOR_CONTEXT) {
      console.log('[useListSuggestions] Not enough items for context:', items.length);
      return [];
    }

    // Prevenir chamadas simultâneas
    if (isFetchingRef.current) {
      console.log('[useListSuggestions] Already fetching, skipping...');
      return [];
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

      const response = await fetch('/api/suggest-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          prompt,
          listType: 'sugestões complementares',
          maxResults: 5
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

      // Salvar no cache
      await db.listSuggestionCache.put({
        listId,
        suggestions: filteredSuggestions,
        createdAt: new Date(),
        itemsCountWhenGenerated: items.length,
        lastItemNamesHash: createItemsHash(items)
      });

      return filteredSuggestions;
    } catch (err) {
      console.error('[useListSuggestions] Error fetching suggestions:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, listId, items]);

  /**
   * Carrega sugestões (do cache ou API)
   */
  const loadSuggestions = useCallback(async () => {
    if (!listId) {
      setSuggestions([]);
      return;
    }

    // Verificar cache primeiro
    const cacheIsValid = await isCacheValid();

    if (cacheIsValid) {
      const cached = await db.listSuggestionCache.get(listId);
      if (cached) {
        setSuggestions(cached.suggestions);
        return;
      }
    }

    // Cache inválido ou não existe - buscar da API
    const newSuggestions = await fetchSuggestions();
    setSuggestions(newSuggestions);
  }, [listId, isCacheValid, fetchSuggestions]);

  /**
   * Força atualização das sugestões
   */
  const refreshSuggestions = useCallback(async () => {
    if (!listId) return;

    // Limpar cache
    await db.listSuggestionCache.delete(listId);

    // Buscar novamente
    const newSuggestions = await fetchSuggestions();
    setSuggestions(newSuggestions);
  }, [listId, fetchSuggestions]);

  /**
   * Descarta sugestões (usuário não quer ver)
   */
  const dismissSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Carregar sugestões ao montar ou quando listId mudar
  useEffect(() => {
    loadSuggestions();
  }, [listId]); // Apenas listId, não incluir loadSuggestions para evitar loops

  // Detectar mudanças significativas na lista e reagir com debounce
  useEffect(() => {
    // Limpar timeout anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Verificar se houve mudança significativa
    const itemsDiff = Math.abs(items.length - lastItemCount.current);

    if (itemsDiff >= ITEMS_CHANGE_THRESHOLD) {
      console.log('[useListSuggestions] Detected', itemsDiff, 'new items, scheduling refresh...');

      // Agendar atualização com debounce
      debounceTimer.current = setTimeout(() => {
        console.log('[useListSuggestions] Debounce completed, refreshing suggestions');
        loadSuggestions();
      }, DEBOUNCE_MS);
    }

    // Atualizar contador
    lastItemCount.current = items.length;

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [items.length]); // Apenas length, não incluir loadSuggestions

  return {
    suggestions,
    loading,
    error,
    refreshSuggestions,
    dismissSuggestions
  };
};
