import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type PurchaseHistoryRow = Database['public']['Tables']['purchase_history']['Row'];

export const usePurchaseHistory = (userId: string) => {
  const [history, setHistory] = useState<PurchaseHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
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
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  return { history, loading, error };
};
