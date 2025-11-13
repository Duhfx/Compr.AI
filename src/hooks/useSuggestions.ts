// src/hooks/useSuggestions.ts
// Release 3: Intelligent autocomplete based on history and AI

import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/db';
import { useDeviceId } from './useDeviceId';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
  const deviceId = useDeviceId();

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
  const { user } = useAuth();

  const createListFromPrompt = useCallback(async (prompt: string) => {
    if (!user) {
      const error = new Error('Usuário não autenticado. Por favor, faça login.');
      setError(error);
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useCreateListWithAI] Creating list for user:', user.id, 'Prompt:', prompt);

      // Chamar API para obter sugestões
      const response = await fetch('/api/suggest-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, // Usar userId ao invés de deviceId
          prompt,
          listType: 'interpretação livre',
          maxResults: 15
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[useCreateListWithAI] API error:', response.status, errorData);
        throw new Error(`Failed to create list with AI: ${errorData.error || errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('[useCreateListWithAI] Got', data.items?.length || 0, 'suggestions from AI');

      if (!data.items || data.items.length === 0) {
        throw new Error('IA não retornou sugestões. Tente reformular sua descrição.');
      }

      // Criar lista no Supabase
      const { data: createdList, error: listError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          name: prompt,
        })
        .select()
        .single();

      if (listError) {
        console.error('[useCreateListWithAI] Error creating list:', listError);
        throw new Error(`Failed to create list: ${listError.message}`);
      }

      console.log('[useCreateListWithAI] List created:', createdList.id);

      // Adicionar itens sugeridos ao Supabase
      const itemsToInsert = data.items.map((item: any) => ({
        list_id: createdList.id,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'un',
        category: item.category,
        checked: false,
      }));

      const { error: itemsError } = await supabase
        .from('shopping_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('[useCreateListWithAI] Error creating items:', itemsError);
        // Deletar a lista se falhar ao criar itens
        await supabase.from('shopping_lists').delete().eq('id', createdList.id);
        throw new Error(`Failed to create items: ${itemsError.message}`);
      }

      console.log('[useCreateListWithAI] Created', itemsToInsert.length, 'items');

      setLoading(false);
      return createdList.id;
    } catch (err) {
      console.error('Error creating list with AI:', err);
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, [user]);

  return {
    createListFromPrompt,
    loading,
    error
  };
};
