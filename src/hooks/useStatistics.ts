import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

export interface CategorySpending {
  category: string;
  total: number;
  count: number;
}

export interface MonthlySpending {
  month: string; // "2024-01" format
  total: number;
  itemsCount: number;
}

export interface TopItem {
  name: string;
  purchaseCount: number;
  lastPurchased: Date;
}

export interface PriceTrend {
  itemName: string;
  prices: Array<{
    date: string;
    price: number;
    store?: string;
  }>;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface Statistics {
  // Resumo geral
  totalSpent: number;
  totalPurchases: number;
  averageBasketValue: number;
  mostExpensiveItem: { name: string; price: number } | null;

  // Por categoria
  categorySpending: CategorySpending[];
  topCategories: CategorySpending[];

  // Por mês
  monthlySpending: MonthlySpending[];
  currentMonthSpending: number;
  lastMonthSpending: number;

  // Itens mais comprados
  topItems: TopItem[];

  // Tendências de preço
  priceTrends: PriceTrend[];
}

/**
 * Hook para calcular estatísticas do histórico de compras e preços
 *
 * Calcula:
 * - Total gasto (baseado em price_history)
 * - Gastos por categoria
 * - Gastos por mês
 * - Itens mais comprados
 * - Tendências de preço (variação ao longo do tempo)
 *
 * @param userId - ID do usuário
 */
export const useStatistics = (userId: string) => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const calculateStatistics = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        console.log('[useStatistics] Calculando estatísticas para user:', userId);

        // 1. Buscar histórico de preços
        const { data: priceHistory, error: priceError } = await supabase
          .from('price_history')
          .select('*')
          .eq('user_id', userId)
          .order('purchased_at', { ascending: false });

        if (priceError) throw priceError;

        // 2. Buscar histórico de compras
        const { data: purchaseHistory, error: purchaseError } = await supabase
          .from('purchase_history')
          .select('*')
          .eq('user_id', userId)
          .order('purchased_at', { ascending: false });

        if (purchaseError) throw purchaseError;

        // ============================================
        // Calcular métricas
        // ============================================

        // Total gasto
        const totalSpent = priceHistory?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
        const totalPurchases = purchaseHistory?.length || 0;

        // Item mais caro
        const mostExpensiveItem = priceHistory && priceHistory.length > 0
          ? priceHistory.reduce((max, p) => p.price > max.price ? p : max)
          : null;

        // Média do "carrinho" (aproximação: total gasto / número de compras únicas por data+loja)
        const uniquePurchaseDates = new Set(
          priceHistory?.map(p => `${p.purchased_at}_${p.store || 'unknown'}`)
        ).size;
        const averageBasketValue = uniquePurchaseDates > 0 ? totalSpent / uniquePurchaseDates : 0;

        // ============================================
        // Gastos por categoria
        // ============================================
        const categoryMap = new Map<string, { total: number; count: number }>();

        purchaseHistory?.forEach(p => {
          const category = p.category || 'Outros';
          const existing = categoryMap.get(category) || { total: 0, count: 0 };

          // Tentar encontrar preço correspondente
          const priceMatch = priceHistory?.find(
            ph => ph.item_name === p.item_name &&
                  new Date(ph.purchased_at).toDateString() === new Date(p.purchased_at).toDateString()
          );

          existing.total += priceMatch?.price || 0;
          existing.count += 1;
          categoryMap.set(category, existing);
        });

        const categorySpending: CategorySpending[] = Array.from(categoryMap.entries()).map(
          ([category, data]) => ({
            category,
            total: data.total,
            count: data.count
          })
        );

        const topCategories = [...categorySpending]
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        // ============================================
        // Gastos por mês
        // ============================================
        const monthlyMap = new Map<string, { total: number; itemsCount: number }>();

        priceHistory?.forEach(p => {
          const month = p.purchased_at.substring(0, 7); // "2024-01"
          const existing = monthlyMap.get(month) || { total: 0, itemsCount: 0 };
          existing.total += p.price;
          existing.itemsCount += 1;
          monthlyMap.set(month, existing);
        });

        const monthlySpending: MonthlySpending[] = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({
            month,
            total: data.total,
            itemsCount: data.itemsCount
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        // Mês atual e anterior
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .substring(0, 7);

        const currentMonthSpending = monthlyMap.get(currentMonth)?.total || 0;
        const lastMonthSpending = monthlyMap.get(lastMonth)?.total || 0;

        // ============================================
        // Itens mais comprados
        // ============================================
        const itemCountMap = new Map<string, { count: number; lastPurchased: Date }>();

        purchaseHistory?.forEach(p => {
          const existing = itemCountMap.get(p.item_name) || {
            count: 0,
            lastPurchased: new Date(0)
          };

          existing.count += 1;
          const purchaseDate = new Date(p.purchased_at);
          if (purchaseDate > existing.lastPurchased) {
            existing.lastPurchased = purchaseDate;
          }

          itemCountMap.set(p.item_name, existing);
        });

        const topItems: TopItem[] = Array.from(itemCountMap.entries())
          .map(([name, data]) => ({
            name,
            purchaseCount: data.count,
            lastPurchased: data.lastPurchased
          }))
          .sort((a, b) => b.purchaseCount - a.purchaseCount)
          .slice(0, 10);

        // ============================================
        // Tendências de preço (top 5 itens mais comprados)
        // ============================================
        const priceTrends: PriceTrend[] = [];

        const topItemsForTrends = topItems.slice(0, 5);

        topItemsForTrends.forEach(topItem => {
          const prices = priceHistory
            ?.filter(p => p.item_name === topItem.name)
            .map(p => ({
              date: p.purchased_at,
              price: p.price,
              store: p.store || undefined
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          if (prices && prices.length > 0) {
            const priceValues = prices.map(p => p.price);
            const averagePrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
            const minPrice = Math.min(...priceValues);
            const maxPrice = Math.max(...priceValues);

            priceTrends.push({
              itemName: topItem.name,
              prices,
              averagePrice,
              minPrice,
              maxPrice
            });
          }
        });

        // ============================================
        // Montar resultado
        // ============================================
        const stats: Statistics = {
          totalSpent,
          totalPurchases,
          averageBasketValue,
          mostExpensiveItem: mostExpensiveItem
            ? { name: mostExpensiveItem.item_name, price: mostExpensiveItem.price }
            : null,
          categorySpending,
          topCategories,
          monthlySpending,
          currentMonthSpending,
          lastMonthSpending,
          topItems,
          priceTrends
        };

        console.log('[useStatistics] Estatísticas calculadas:');
        console.log('  Total gasto: R$', totalSpent.toFixed(2));
        console.log('  Total de compras:', totalPurchases);
        console.log('  Média por compra: R$', averageBasketValue.toFixed(2));
        console.log('  Categorias:', categorySpending.length);
        console.log('  Meses com dados:', monthlySpending.length);

        setStatistics(stats);
        setLoading(false);

      } catch (err) {
        console.error('[useStatistics] Erro:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    calculateStatistics();
  }, [userId]);

  return {
    statistics,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-executar useEffect
    }
  };
};
