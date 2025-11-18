import { useEffect, useState } from 'react';
import { usePriceEstimation, type PriceEstimation } from '../../hooks/usePriceEstimation';
import type { ShoppingItem } from '../../hooks/useSupabaseItems';
import { TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface PredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  userId: string;
  listName: string;
}

/**
 * Modal de Previsão de Gastos
 *
 * Mostra:
 * - Total estimado
 * - Nível de confiança (visual)
 * - Breakdown por item
 * - Avisos sobre itens sem histórico
 */
export const PredictionModal: React.FC<PredictionModalProps> = ({
  isOpen,
  onClose,
  items,
  userId,
  listName
}) => {
  const { estimation, estimatePrice, loading, error } = usePriceEstimation(items, userId);
  const [showDetails, setShowDetails] = useState(false);

  // Calcular estimativa ao abrir modal
  useEffect(() => {
    if (isOpen && items.length > 0) {
      estimatePrice();
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  // Helper: Cor da confiança
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (confidence >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Previsão de Gastos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{listName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Calculando previsão...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Erro ao calcular previsão</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error.message}</p>
              </div>
            </div>
          )}

          {estimation && !loading && (
            <>
              {/* Total Estimado */}
              <div className={`${getConfidenceBg(estimation.averageConfidence)} border ${estimation.averageConfidence >= 80 ? 'border-green-200 dark:border-green-800' : estimation.averageConfidence >= 50 ? 'border-yellow-200 dark:border-yellow-800' : 'border-red-200 dark:border-red-800'} rounded-xl p-6`}>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Custo Estimado Total
                  </p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    R$ {estimation.totalEstimated.toFixed(2)}
                  </p>

                  {/* Nível de Confiança */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-full">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confiança:</span>
                    <span className={`text-sm font-bold ${getConfidenceColor(estimation.averageConfidence)}`}>
                      {estimation.averageConfidence}%
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${estimation.averageConfidence >= 80 ? 'bg-green-500' : estimation.averageConfidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${estimation.averageConfidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Com Histórico</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {estimation.itemsWithHistory}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Sem Histórico</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {estimation.itemsWithoutHistory}
                  </p>
                </div>
              </div>

              {/* Aviso sobre itens sem histórico */}
              {estimation.itemsWithoutHistory > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Previsão Parcial
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      {estimation.itemsWithoutHistory} {estimation.itemsWithoutHistory === 1 ? 'item não tem' : 'itens não têm'} histórico de preços.
                      Escaneie notas fiscais para melhorar a precisão.
                    </p>
                  </div>
                </div>
              )}

              {/* Toggle Detalhes */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-between"
              >
                <span>{showDetails ? 'Ocultar' : 'Ver'} Detalhes por Item</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Detalhamento por Item */}
              {showDetails && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Detalhes por Item
                  </h3>
                  {estimation.breakdown.map((item) => (
                    <div
                      key={item.itemId}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.itemName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            R$ {item.estimatedTotal.toFixed(2)}
                          </p>
                          <p className={`text-xs font-medium ${getConfidenceColor(item.confidence)}`}>
                            {item.confidence}% confiança
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Preço unitário estimado:
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          R$ {item.estimatedUnitPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Histórico de Preços */}
                      {item.hasHistory && item.historicalPrices && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Preços anteriores:
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {item.historicalPrices.map((price, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                              >
                                R$ {price.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!item.hasHistory && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            Sem histórico de preços
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {items.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adicione itens à lista para ver a previsão de gastos
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
