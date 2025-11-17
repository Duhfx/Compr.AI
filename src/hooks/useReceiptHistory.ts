import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ReceiptItem {
  id: string;
  item_name: string;
  price: number;
}

export interface ReceiptHistoryItem {
  store: string;
  date: string;
  itemCount: number;
  totalPrice: number;
  items: ReceiptItem[];
}

export const useReceiptHistory = (userId: string) => {
  const [receipts, setReceipts] = useState<ReceiptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ✅ Extrair função de fetch para permitir refetch manual
  const fetchReceipts = async (background = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // ✅ Só mostra loading se não for background refetch
      if (!background) {
        setLoading(true);
      } else {
        console.log('[useReceiptHistory] Background refetch iniciado');
      }

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
          existing.items.push({
            id: item.id,
            item_name: item.item_name,
            price: item.price,
          });
        } else {
          grouped.set(key, {
            store: item.store || 'Loja Desconhecida',
            date: item.purchased_at,
            itemCount: 1,
            totalPrice: item.price,
            items: [{
              id: item.id,
              item_name: item.item_name,
              price: item.price,
            }],
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
    if (receipts.length > 0) {
      fetchReceipts(true);
    } else {
      fetchReceipts(false);
    }
  }, [userId]);

  // ✅ Expor refetch para uso manual
  return {
    receipts,
    loading,
    error,
    refetch: () => fetchReceipts(true)
  };
};
