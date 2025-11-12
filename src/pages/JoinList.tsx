// src/pages/JoinList.tsx
// Página para entrar em lista compartilhada via URL (/join/:code)

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinSharedList, validateShareCode } from '../lib/sharing';
import { db } from '../lib/db';

export const JoinList: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationInfo, setValidationInfo] = useState<{
    listName: string;
    permission: 'edit' | 'readonly';
  } | null>(null);
  const [joining, setJoining] = useState(false);

  // Buscar deviceId do localStorage
  const getDeviceId = async () => {
    const devices = await db.userDevice.toArray();
    if (devices.length === 0) {
      // Criar novo dispositivo se não existir
      const newDeviceId = crypto.randomUUID();
      await db.userDevice.add({
        deviceId: newDeviceId,
        nickname: 'Meu Dispositivo',
      });
      return newDeviceId;
    }
    return devices[0].deviceId;
  };

  // Validar código ao carregar
  useEffect(() => {
    const validateCode = async () => {
      if (!code) {
        setError('Código não fornecido');
        setLoading(false);
        return;
      }

      try {
        const result = await validateShareCode(code);
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
        console.error('Validation error:', err);
      } finally {
        setLoading(false);
      }
    };

    validateCode();
  }, [code]);

  // Entrar na lista
  const handleJoin = async () => {
    if (!code) return;

    try {
      setJoining(true);
      setError(null);

      const deviceId = await getDeviceId();
      const result = await joinSharedList(code, deviceId);

      // Redirecionar para a lista
      navigate(`/list/${result.listId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar na lista');
      console.error('Error joining list:', err);
    } finally {
      setJoining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Validando código...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Erro ao Acessar Lista
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 font-medium"
            >
              Ir para Página Inicial
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - mostrar informações da lista
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Ícone de sucesso */}
        <div className="flex items-center justify-center w-20 h-20 mx-auto bg-green-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Informações */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Convite para Lista
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Você foi convidado para colaborar na lista
        </p>

        {validationInfo && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-indigo-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-lg text-indigo-900 mb-1">
                  {validationInfo.listName}
                </p>
                <p className="text-sm text-indigo-700">
                  Permissão: <span className="font-medium">
                    {validationInfo.permission === 'edit' ? 'Edição' : 'Somente Leitura'}
                  </span>
                </p>
                {validationInfo.permission === 'edit' ? (
                  <p className="text-xs text-indigo-600 mt-2">
                    Você poderá adicionar, editar e remover itens da lista
                  </p>
                ) : (
                  <p className="text-xs text-indigo-600 mt-2">
                    Você poderá apenas visualizar a lista
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Código */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código de Compartilhamento
          </label>
          <div className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-center">
            <code className="text-2xl font-mono font-bold text-gray-900 tracking-widest">
              {code}
            </code>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
          >
            {joining ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar na Lista'
            )}
          </button>
          <button
            onClick={() => navigate('/')}
            disabled={joining}
            className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            Cancelar
          </button>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Ao entrar, você terá acesso à lista compartilhada e suas alterações serão sincronizadas em tempo real
          </p>
        </div>
      </div>
    </div>
  );
};
