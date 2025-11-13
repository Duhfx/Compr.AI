// src/components/suggestions/SuggestionsBanner.tsx
// Banner discreto para mostrar sugestões de IA na visualização da lista

import { motion, AnimatePresence } from 'framer-motion';

interface SuggestedItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

interface SuggestionsBannerProps {
  suggestions: SuggestedItem[];
  loading: boolean;
  onAddSuggestion: (suggestion: SuggestedItem) => void;
  onDismiss: () => void;
  onRefresh: () => void;
}

export const SuggestionsBanner = ({
  suggestions,
  loading,
  onAddSuggestion,
  onDismiss,
  onRefresh
}: SuggestionsBannerProps) => {
  // Não mostrar nada se não houver sugestões e não estiver carregando
  if (!loading && suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loading ? 'loading' : 'suggestions'}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="mb-4"
      >
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-ios p-4 shadow-sm border border-indigo-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-500 rounded-full">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">
                  Sugestões para você
                </h3>
                <p className="text-[13px] text-gray-500">
                  {loading ? 'Pensando...' : `${suggestions.length} ${suggestions.length === 1 ? 'sugestão' : 'sugestões'}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Refresh Button */}
              {!loading && suggestions.length > 0 && (
                <button
                  onClick={onRefresh}
                  className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg active:opacity-70 transition-colors"
                  title="Atualizar sugestões"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}

              {/* Dismiss Button */}
              <button
                onClick={onDismiss}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg active:opacity-70 transition-colors"
                title="Dispensar sugestões"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-[15px] font-medium">Gerando sugestões...</span>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          {!loading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={`${suggestion.name}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-medium text-gray-900">
                          {suggestion.name}
                        </span>
                        {suggestion.category && (
                          <span className="text-[12px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {suggestion.category}
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-gray-500 mt-0.5">
                        {suggestion.quantity} {suggestion.unit}
                      </div>
                    </div>

                    <button
                      onClick={() => onAddSuggestion(suggestion)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-[14px] font-semibold active:bg-indigo-600 transition-colors hover:bg-indigo-600 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State (após carregar) */}
          {!loading && suggestions.length === 0 && (
            <div className="text-center py-4">
              <p className="text-[14px] text-gray-500">
                Nenhuma sugestão disponível no momento
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
