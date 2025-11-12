// src/hooks/useSuggestions.ts
// Release 3: Intelligent autocomplete based on history and AI

import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/db';
import { useDeviceId } from './useDeviceId';

interface Suggestion {
  name: string;
  category?: string;
  unit: string;
  quantity: number;
  source: 'history' | 'ai';
}

interface UseSuggestionsOptions {
  minChars?: number;
  maxSuggestions?: number;
  debounceMs?: number;
}

export const useSuggestions = (options: UseSuggestionsOptions = {}) => {
  const {
    minChars = 2,
    maxSuggestions = 5,
    debounceMs = 300
  } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { deviceId } = useDeviceId();

  // Debounce timeout
  const [debounceTimeout, setDebounceTimeout] = useState<number | null>(null);

  const getSuggestions = useCallback(async (input: string) => {
    // Limpar timeout anterior
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Resetar se input muito curto
    if (input.length < minChars) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce
    const timeout = setTimeout(async () => {
      try {
        // 1. Buscar no histórico local primeiro (mais rápido)
        const localMatches = await db.purchaseHistory
          .where('itemName')
          .startsWithIgnoreCase(input)
          .limit(maxSuggestions)
          .toArray();

        const historySuggestions: Suggestion[] = localMatches.map(item => ({
          name: item.itemName,
          category: item.category,
          unit: item.unit,
          quantity: item.quantity,
          source: 'history' as const
        }));

        // Se encontrou resultados suficientes no histórico, usar apenas eles
        if (historySuggestions.length >= maxSuggestions) {
          setSuggestions(historySuggestions.slice(0, maxSuggestions));
          setLoading(false);
          return;
        }

        // 2. Se não houver matches suficientes, consultar IA
        if (historySuggestions.length < maxSuggestions && input.length >= 3) {
          try {
            const response = await fetch('/api/suggest-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceId,
                prompt: input,
                maxResults: maxSuggestions - historySuggestions.length
              })
            });

            if (!response.ok) {
              throw new Error('Failed to get AI suggestions');
            }

            const aiData = await response.json();
            const aiSuggestions: Suggestion[] = aiData.items.map((item: any) => ({
              name: item.name,
              category: item.category,
              unit: item.unit || 'un',
              quantity: item.quantity || 1,
              source: 'ai' as const
            }));

            // Combinar histórico + IA (histórico tem prioridade)
            const combined = [...historySuggestions, ...aiSuggestions];
            setSuggestions(combined.slice(0, maxSuggestions));
          } catch (aiError) {
            console.error('AI suggestions failed, using only history:', aiError);
            setSuggestions(historySuggestions);
          }
        } else {
          setSuggestions(historySuggestions);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error getting suggestions:', err);
        setError(err as Error);
        setSuggestions([]);
        setLoading(false);
      }
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [deviceId, minChars, maxSuggestions, debounceMs, debounceTimeout]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
    clearSuggestions
  };
};

// Hook auxiliar para criar lista com IA
export const useCreateListWithAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { deviceId } = useDeviceId();

  const createListFromPrompt = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      // Chamar API para obter sugestões
      const response = await fetch('/api/suggest-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          prompt,
          listType: 'interpretação livre'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create list with AI');
      }

      const data = await response.json();

      // Criar lista no IndexedDB
      const listId = crypto.randomUUID();
      await db.shoppingLists.add({
        id: listId,
        name: prompt,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocal: true
      });

      // Adicionar itens sugeridos
      for (const item of data.items) {
        await db.shoppingItems.add({
          id: crypto.randomUUID(),
          listId,
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'un',
          category: item.category,
          checked: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      setLoading(false);
      return listId;
    } catch (err) {
      console.error('Error creating list with AI:', err);
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, [deviceId]);

  return {
    createListFromPrompt,
    loading,
    error
  };
};
