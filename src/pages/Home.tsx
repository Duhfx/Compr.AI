import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalLists } from '../hooks/useLocalLists';
import { useDeviceId } from '../hooks/useDeviceId';
import { useSync } from '../hooks/useSync';
import { Layout } from '../components/layout/Layout';
import { ListCard } from '../components/lists/ListCard';
import { CreateListWithAIModal } from '../components/lists/CreateListWithAIModal';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const { lists, loading, createList, deleteList, refreshLists } = useLocalLists();
  const deviceId = useDeviceId();
  const { sync, syncing } = useSync();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const hasSynced = useRef(false);

  // Sincronizar automaticamente quando o deviceId estiver disponível
  useEffect(() => {
    const autoSync = async () => {
      if (deviceId && !hasSynced.current && !syncing && !loading) {
        hasSynced.current = true;
        console.log('Auto-syncing with deviceId:', deviceId);

        const result = await sync(deviceId);

        if (result.success && (result.listsDownloaded > 0 || result.itemsDownloaded > 0)) {
          console.log('Sync successful:', result);
          // Recarregar as listas após sincronização
          await refreshLists();
          toast.success(`Sincronizado! ${result.listsDownloaded} listas e ${result.itemsDownloaded} itens baixados.`);
        }
      }
    };

    autoSync();
  }, [deviceId, syncing, loading, sync, refreshLists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const newList = await createList(newListName.trim());
      setNewListName('');
      setIsCreating(false);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }

      toast.success('Lista criada!');

      // Sincronizar automaticamente se o usuário está autenticado
      if (deviceId) {
        console.log('[Home] Auto-syncing after list creation with deviceId:', deviceId);
        sync(deviceId).catch(err => {
          console.error('[Home] Error syncing after list creation:', err);
        });
      }

      navigate(`/list/${newList.id}`);
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      toast.error('Erro ao criar lista');
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList(id);
      toast.success('Lista excluída');
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      toast.error('Erro ao excluir lista');
    }
  };

  if (loading || syncing) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{syncing ? 'Sincronizando...' : 'Carregando...'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Toaster position="top-center" />

      <div className="px-4 py-4">
        {/* Add List Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setIsCreating(true)}
            className="h-12 bg-primary text-white rounded-ios text-[17px] font-semibold active:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Lista
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="h-12 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-ios text-[17px] font-semibold active:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Com IA
          </button>
        </div>

        {/* AI Modal */}
        <CreateListWithAIModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
        />

        {/* Create List Input (iOS Bottom Sheet style) */}
        <AnimatePresence>
          {isCreating && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreating(false)}
                className="fixed inset-0 bg-black bg-opacity-40 z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] z-50 max-w-screen-sm mx-auto shadow-ios-lg safe-bottom"
              >
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="px-4 pb-6">
                  <h2 className="text-[20px] font-semibold text-center mb-6">
                    Nova Lista
                  </h2>
                  <form onSubmit={handleCreateList} className="space-y-4">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Nome da lista"
                      className="w-full px-4 py-3 bg-gray-100 rounded-ios text-[17px] focus:outline-none focus:bg-gray-150 transition-colors"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          setNewListName('');
                        }}
                        className="flex-1 h-12 rounded-ios text-[17px] font-semibold text-primary border-2 border-primary hover:bg-primary hover:bg-opacity-5 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-12 bg-primary text-white rounded-ios text-[17px] font-semibold hover:bg-opacity-90 transition-colors"
                      >
                        Criar
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Lists */}
        {lists.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="h-24 w-24 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-[20px] font-semibold text-gray-900 mb-2">
              Nenhuma lista
            </h3>
            <p className="text-[15px] text-gray-500">
              Toque em "Nova Lista" para começar
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-ios overflow-hidden">
            {lists.map((list, index) => (
              <div key={list.id}>
                <ListCard
                  list={list}
                  onClick={() => navigate(`/list/${list.id}`)}
                  onDelete={handleDeleteList}
                />
                {index < lists.length - 1 && <div className="h-px bg-gray-150 ml-4" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
