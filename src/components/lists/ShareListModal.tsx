// src/components/lists/ShareListModal.tsx
// Modal para compartilhar lista com outras pessoas

import { useState } from 'react';
import { createShareLink, getShareInfo, revokeShareLink } from '../../lib/sharing';

interface ShareListModalProps {
  listId: string;
  listName: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  listId,
  listName,
  userId,
  isOpen,
  onClose,
}) => {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [permission, setPermission] = useState<'edit' | 'readonly'>('edit');
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [singleUse, setSingleUse] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar informações existentes ao abrir
  const loadShareInfo = async () => {
    const info = await getShareInfo(listId);
    if (info) {
      setShareCode(info.shareCode);
      setShareUrl(info.shareUrl);
      setPermission(info.permission);
      setSingleUse(info.singleUse);
    }
  };

  // Gerar novo link de compartilhamento
  const handleCreateLink = async () => {
    // Validar userId antes de criar o link
    if (!userId) {
      setError('Aguarde o carregamento do usuário...');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { shareCode: code, shareUrl: url } = await createShareLink(
        listId,
        userId,
        permission,
        expiresInDays,
        singleUse
      );

      setShareCode(code);
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar link');
      console.error('Error creating share link:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copiar código/link para área de transferência
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  // Revogar link de compartilhamento
  const handleRevoke = async () => {
    if (!confirm('Tem certeza que deseja revogar este link? Ninguém mais poderá entrar na lista.')) {
      return;
    }

    try {
      setLoading(true);
      await revokeShareLink(listId);
      setShareCode(null);
      setShareUrl(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao revogar link');
    } finally {
      setLoading(false);
    }
  };

  // Carregar info ao abrir modal
  if (isOpen && !shareCode && !loading) {
    loadShareInfo();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Compartilhar Lista</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{listName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Formulário de criação */}
        {!shareCode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissão
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'edit' | 'readonly')}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                disabled={loading}
              >
                <option value="edit">Editar (pode adicionar/remover itens)</option>
                <option value="readonly">Somente Visualizar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiração (opcional)
              </label>
              <select
                value={expiresInDays || ''}
                onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2"
                disabled={loading}
              >
                <option value="">Nunca expira</option>
                <option value="1">1 dia</option>
                <option value="7">7 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <input
                type="checkbox"
                id="singleUse"
                checked={singleUse}
                onChange={(e) => setSingleUse(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                disabled={loading}
              />
              <div className="flex-1">
                <label htmlFor="singleUse" className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Código de uso único
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {singleUse
                    ? 'O código será invalidado após a primeira pessoa entrar'
                    : 'O código pode ser usado várias vezes até ser revogado'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateLink}
              disabled={loading || !userId}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando...' : !userId ? 'Carregando...' : 'Gerar Código de Compartilhamento'}
            </button>
          </div>
        )}

        {/* Exibição do código/link */}
        {shareCode && shareUrl && (
          <div className="space-y-4">
            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de Compartilhamento
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareCode}
                  readOnly
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white font-mono text-lg text-center"
                />
                <button
                  onClick={() => copyToClipboard(shareCode)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                  title="Copiar código"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link Direto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                  title="Copiar link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Informações */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Permissão:</strong> {permission === 'edit' ? 'Edição' : 'Somente Leitura'}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                <strong>Tipo:</strong> {singleUse ? 'Uso único' : 'Reutilizável'}
              </p>
              {expiresInDays && (
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  <strong>Expira em:</strong> {expiresInDays} {expiresInDays === 1 ? 'dia' : 'dias'}
                </p>
              )}
            </div>

            {/* Botão de revogar */}
            <button
              onClick={handleRevoke}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              {loading ? 'Revogando...' : 'Revogar Link de Compartilhamento'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Dica: Use códigos de uso único para mais segurança, ou códigos reutilizáveis para facilitar o compartilhamento com várias pessoas.
          </p>
        </div>
      </div>
    </div>
  );
};
