// src/components/lists/CreateListWithAIModal.tsx
// Release 3: Create shopping list using AI from free-form text

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateListWithAI } from '../../hooks/useSuggestions';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface CreateListWithAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateListWithAIModal: React.FC<CreateListWithAIModalProps> = ({
  isOpen,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const { createListFromPrompt, loading, error } = useCreateListWithAI();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() || loading) return;

    try {
      const listId = await createListFromPrompt(prompt.trim());
      onClose();
      setPrompt('');
      navigate(`/list/${listId}`);
    } catch (err) {
      console.error('Failed to create list with AI:', err);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setPrompt('');
    }
  };

  const examples = [
    'Lista para churrasco no fim de semana',
    'Café da manhã saudável para a semana',
    'Ingredientes para fazer lasanha',
    'Compras do mês',
    'Festa de aniversário infantil'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Criar Lista com IA
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Descreva sua lista de compras
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Lista para churrasco no fim de semana"
                rows={4}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Exemplos */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Exemplos:
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPrompt(example)}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Erro ao criar lista: {error.message}
                </p>
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                A IA irá gerar uma lista de compras completa baseada na sua descrição,
                usando seu histórico de compras quando possível.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="flex-1 px-4 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Criar Lista
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
