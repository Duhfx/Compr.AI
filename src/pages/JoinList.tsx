// src/pages/JoinList.tsx
// Página para entrar em lista compartilhada via link direto

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateShareCode, joinSharedList } from '../lib/sharing';
import { Layout } from '../components/layout/Layout';

export const JoinList = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listInfo, setListInfo] = useState<{ name: string; permission: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processJoin = async () => {
      console.log('[JoinList] Processing join with code:', code);

      if (!code) {
        setError('Código de compartilhamento inválido');
        setLoading(false);
        return;
      }

      if (authLoading) {
        return;
      }

      if (!user) {
        setError('Faça login para entrar na lista compartilhada');
        navigate(`/login?redirect=/join/${code}`);
        return;
      }

      try {
        setLoading(true);

        const validation = await validateShareCode(code);

        if (!validation.valid) {
          setError(validation.error || 'Código inválido');
          setLoading(false);
          return;
        }

        setListInfo({
          name: validation.data!.listName,
          permission: validation.data!.permission,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await joinSharedList(code, user.id);

        navigate(`/list/${result.listId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao entrar na lista';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    processJoin();
  }, [code, user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-[17px] text-gray-600">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (loading && !error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          {listInfo ? (
            <>
              <p className="text-[20px] font-semibold text-gray-900 mb-2">
                Entrando em "{listInfo.name}"
              </p>
              <p className="text-[15px] text-gray-600">
                Permissão: {listInfo.permission === 'edit' ? 'Edição' : 'Somente Leitura'}
              </p>
            </>
          ) : (
            <p className="text-[17px] text-gray-600">Validando código...</p>
          )}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-gray-900 mb-2">
            Erro ao Entrar na Lista
          </h2>
          <p className="text-[15px] text-gray-600 text-center mb-6 max-w-md">
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-ios text-[17px] font-semibold hover:bg-opacity-90 active:opacity-70 transition-colors"
          >
            Voltar para Home
          </button>
        </div>
      </Layout>
    );
  }

  return null;
};
