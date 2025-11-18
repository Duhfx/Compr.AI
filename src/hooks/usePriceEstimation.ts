import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ShoppingItem } from './useSupabaseItems';

export interface ItemEstimation {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  confidence: number; // 0-100
  hasHistory: boolean;
  historicalPrices?: number[];
}

export interface PriceEstimation {
  totalEstimated: number;
  averageConfidence: number;
  itemsWithHistory: number;
  itemsWithoutHistory: number;
  breakdown: ItemEstimation[];
}

/**
 * Hook para estimar custo total de uma lista baseado em histórico de preços
 *
 * Para cada item:
 * - Busca últimos 5 preços em price_history
 * - Calcula média ponderada (mais recentes têm mais peso)
 * - Se não houver histórico, retorna estimativa baixa com confiança 0%
 * - Confiança aumenta com quantidade de dados históricos
 *
 * @param items - Itens da lista
 * @param userId - ID do usuário
 */
export const usePriceEstimation = (items: ShoppingItem[], userId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [estimation, setEstimation] = useState<PriceEstimation | null>(null);

  const estimatePrice = async (): Promise<PriceEstimation> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[usePriceEstimation] Estimando preços para', items.length, 'itens');

      const breakdown: ItemEstimation[] = [];
      let totalEstimated = 0;
      let totalConfidence = 0;
      let itemsWithHistory = 0;
      let itemsWithoutHistory = 0;

      // Processar cada item
      for (const item of items) {
        // Buscar histórico de preços deste item (últimos 5)
        const { data: priceHistory, error: priceError } = await supabase
          .from('price_history')
          .select('price, purchased_at')
          .eq('user_id', userId)
          .ilike('item_name', `%${item.name}%`) // Busca parcial (ex: "Leite" encontra "Leite Integral 1L")
          .order('purchased_at', { ascending: false })
          .limit(5);

        if (priceError) {
          console.error('[usePriceEstimation] Erro ao buscar histórico:', priceError);
        }

        let estimatedUnitPrice = 0;
        let confidence = 0;
        let hasHistory = false;
        const historicalPrices: number[] = [];

        if (priceHistory && priceHistory.length > 0) {
          // Tem histórico - Calcular média ponderada (mais recentes têm mais peso)
          hasHistory = true;
          itemsWithHistory++;

          // Extrair preços
          historicalPrices.push(...priceHistory.map(p => p.price));

          // Média ponderada: peso decrescente (1.0, 0.8, 0.6, 0.4, 0.2)
          const weights = [1.0, 0.8, 0.6, 0.4, 0.2];
          let weightedSum = 0;
          let totalWeight = 0;

          priceHistory.forEach((p, index) => {
            const weight = weights[index] || 0.1;
            weightedSum += p.price * weight;
            totalWeight += weight;
          });

          estimatedUnitPrice = weightedSum / totalWeight;

          // Confiança baseada em quantidade de dados (20% por registro, máx 100%)
          confidence = Math.min(priceHistory.length * 20, 100);

        } else {
          // Sem histórico - Estimativa genérica baixa
          itemsWithoutHistory++;
          estimatedUnitPrice = 10; // R$ 10,00 como fallback conservador
          confidence = 0;
          hasHistory = false;
        }

        const estimatedTotal = estimatedUnitPrice * item.quantity;
        totalEstimated += estimatedTotal;
        totalConfidence += confidence;

        breakdown.push({
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          estimatedUnitPrice,
          estimatedTotal,
          confidence,
          hasHistory,
          historicalPrices: historicalPrices.length > 0 ? historicalPrices : undefined
        });
      }

      const averageConfidence = items.length > 0 ? Math.round(totalConfidence / items.length) : 0;

      const result: PriceEstimation = {
        totalEstimated,
        averageConfidence,
        itemsWithHistory,
        itemsWithoutHistory,
        breakdown
      };

      console.log('[usePriceEstimation] Estimativa concluída:');
      console.log('  Total estimado: R$', totalEstimated.toFixed(2));
      console.log('  Confiança média:', averageConfidence + '%');
      console.log('  Itens com histórico:', itemsWithHistory);
      console.log('  Itens sem histórico:', itemsWithoutHistory);

      setEstimation(result);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[usePriceEstimation] Erro:', message);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    estimation,
    estimatePrice,
    loading,
    error
  };
};
