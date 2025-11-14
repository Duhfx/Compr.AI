import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ReceiptHistoryItem {
  store: string;
  date: string;
  itemCount: number;
  totalPrice: number;
}

export const useReceiptHistory = (userId: string) => {
  const [receipts, setReceipts] = useState<ReceiptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchReceipts = async () => {
      try {
        setLoading(true);

        // Buscar histórico de preços (notas escaneadas)
        const { data, error } = await supabase
          .from('price_history')
          .select('*')
          .eq('user_id', userId)
          .order('purchased_at', { ascending: false });

        if (error) throw error;

        // Agrupar por (store, date)
        const grouped = new Map<string, ReceiptHistoryItem>();

        data?.forEach((item) => {
          const date = item.purchased_at.split('T')[0]; // YYYY-MM-DD
          const key = `${item.store || 'Loja Desconhecida'}_${date}`;

          if (grouped.has(key)) {
            const existing = grouped.get(key)!;
            existing.itemCount += 1;
            existing.totalPrice += item.price;
          } else {
            grouped.set(key, {
              store: item.store || 'Loja Desconhecida',
              date: item.purchased_at,
              itemCount: 1,
              totalPrice: item.price,
            });
          }
        });

        // Converter para array e ordenar por data
        const receiptsArray = Array.from(grouped.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setReceipts(receiptsArray);
      } catch (err) {
        console.error('[useReceiptHistory] Error fetching receipts:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [userId]);

  return { receipts, loading, error };
};
