// src/components/lists/JoinListModal.tsx
// Modal para entrar em lista compartilhada usando código

import { useState } from 'react';
import { joinSharedList, validateShareCode } from '../../lib/sharing';

interface JoinListModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (listId: string) => void;
}

export const JoinListModal: React.FC<JoinListModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationInfo, setValidationInfo] = useState<{
    listName: string;
    permission: 'edit' | 'readonly';
  } | null>(null);

  // Validar código enquanto digita (debounced)
  const handleCodeChange = async (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    setCode(cleaned);
    setError(null);
    setValidationInfo(null);

    // Validar apenas quando tiver 6 caracteres
    if (cleaned.length === 6) {
      setValidating(true);
      try {
        const result = await validateShareCode(cleaned);
        if (result.valid) {
          setValidationInfo({
            listName: result.data!.listName,
            permission: result.data!.permission,
          });
        } else {
          setError(result.error || 'Código inválido');
        }
      } catch (err) {
        setError('Erro ao validar código');
      } finally {
        setValidating(false);
      }
    }
  };

  // Entrar na lista
  const handleJoin = async () => {
    if (!code || code.length !== 6) {
      setError('Digite um código válido de 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await joinSharedList(code, userId);

      // Sucesso
      onSuccess(result.listId);
      onClose();

      // Resetar formulário
      setCode('');
      setValidationInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar na lista');
      console.error('Error joining list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fechar e resetar
  const handleClose = () => {
    setCode('');
    setError(null);
    setValidationInfo(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Entrar em Lista</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Digite o código de compartilhamento</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input do código */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código de 6 Caracteres
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="ABC123"
              maxLength={6}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 rounded-lg px-4 py-3 text-center text-2xl font-mono uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {validating && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                Validando...
              </p>
            )}
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informações da lista (após validação) */}
          {validationInfo && !error && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-200">
                    {validationInfo.listName}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Permissão: {validationInfo.permission === 'edit' ? 'Edição' : 'Somente Leitura'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botão de entrar */}
          <button
            onClick={handleJoin}
            disabled={loading || validating || !validationInfo || !!error || code.length !== 6}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar na Lista'}
          </button>

          {/* Botão de cancelar */}
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>

        {/* Instruções */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            O código é fornecido pela pessoa que compartilhou a lista com você
          </p>
        </div>
      </div>
    </div>
  );
};
