// src/components/lists/ShareListModal.tsx
// Modal para compartilhar lista com outras pessoas

import { useState } from 'react';
import { createShareLink, getShareInfo, revokeShareLink } from '../../lib/sharing';

interface ShareListModalProps {
  listId: string;
  listName: string;
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  listId,
  listName,
  deviceId,
  isOpen,
  onClose,
}) => {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [permission, setPermission] = useState<'edit' | 'readonly'>('edit');
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
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
    }
  };

  // Gerar novo link de compartilhamento
  const handleCreateLink = async () => {
    // Validar deviceId antes de criar o link
    if (!deviceId) {
      setError('Aguarde o carregamento do dispositivo...');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { shareCode: code, shareUrl: url } = await createShareLink(
        listId,
        deviceId,
        permission,
        expiresInDays
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
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Compartilhar Lista</h2>
            <p className="text-sm text-gray-600">{listName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Formulário de criação */}
        {!shareCode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissão
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'edit' | 'readonly')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={loading}
              >
                <option value="edit">Editar (pode adicionar/remover itens)</option>
                <option value="readonly">Somente Visualizar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiração (opcional)
              </label>
              <select
                value={expiresInDays || ''}
                onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={loading}
              >
                <option value="">Nunca expira</option>
                <option value="1">1 dia</option>
                <option value="7">7 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>

            <button
              onClick={handleCreateLink}
              disabled={loading || !deviceId}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando...' : !deviceId ? 'Carregando...' : 'Gerar Código de Compartilhamento'}
            </button>
          </div>
        )}

        {/* Exibição do código/link */}
        {shareCode && shareUrl && (
          <div className="space-y-4">
            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Compartilhamento
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareCode}
                  readOnly
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-mono text-lg text-center"
                />
                <button
                  onClick={() => copyToClipboard(shareCode)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link Direto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  title="Copiar link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Permissão:</strong> {permission === 'edit' ? 'Edição' : 'Somente Leitura'}
              </p>
              {expiresInDays && (
                <p className="text-sm text-blue-800 mt-1">
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
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Qualquer pessoa com o código poderá acessar esta lista
          </p>
        </div>
      </div>
    </div>
  );
};
