import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type PurchaseHistoryRow = Database['public']['Tables']['purchase_history']['Row'];

export const usePurchaseHistory = (userId: string) => {
  const [history, setHistory] = useState<PurchaseHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ✅ Extrair função de fetch para permitir refetch manual
  const fetchHistory = async (background = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // ✅ Só mostra loading se não for background refetch
      if (!background) {
        setLoading(true);
      } else {
        console.log('[usePurchaseHistory] Background refetch iniciado');
      }

      const { data, error } = await supabase
        .from('purchase_history')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setHistory(data || []);
    } catch (err) {
      console.error('[usePurchaseHistory] Error fetching history:', err);
      if (!background) {
        setError(err as Error);
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // ✅ Se já tem dados, fazer background refetch
    if (history.length > 0) {
      fetchHistory(true);
    } else {
      fetchHistory(false);
    }
  }, [userId]);

  // ✅ Expor refetch para uso manual
  return {
    history,
    loading,
    error,
    refetch: () => fetchHistory(true)
  };
};
