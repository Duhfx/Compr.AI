import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseLists } from '../hooks/useSupabaseLists';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { ListCard } from '../components/lists/ListCard';
import { CreateListWithAIModal } from '../components/lists/CreateListWithAIModal';
import { JoinListModal } from '../components/lists/JoinListModal';
import { ReceiptScanner } from '../components/scanner/ReceiptScanner';
import { ActionSheet } from '../components/ui/ActionSheet';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles, Edit, Users, Plus } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lists, loading, createList, deleteList, refreshLists } = useSupabaseLists();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Todas');

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Home] User not authenticated, redirecting to landing');
      navigate('/');
    }
  }, [user, authLoading, navigate]);

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

  const handleJoinSuccess = async (listId: string) => {
    toast.success('Você entrou na lista compartilhada!');
    await refreshLists();
    navigate(`/list/${listId}`);
  };

  // Filter lists based on selected tab
  const filteredLists = useMemo(() => {
    // TODO: Implement actual filtering logic when we have list status
    // For now, just return all lists
    return lists;
  }, [lists, selectedFilter]);

  // Action Sheet options
  const actionSheetOptions = [
    {
      icon: <Edit className="w-5 h-5" />,
      label: 'Nova Lista',
      onClick: () => setIsCreating(true),
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      label: 'Criar com IA',
      onClick: () => setShowAIModal(true),
      gradient: true,
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Entrar em Lista',
      onClick: () => setShowJoinModal(true),
    },
  ];

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <Layout onScanClick={() => setShowScanner(true)}>
      <Toaster position="top-center" />

      <div className="px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[34px] font-bold text-gray-900 mb-2">
            Compr.AI
          </h1>
          <p className="text-[17px] text-gray-500">
            {lists.length === 0
              ? 'Crie sua primeira lista'
              : `${lists.length} ${lists.length === 1 ? 'lista' : 'listas'}`
            }
          </p>
        </div>

        {/* Segmented Control (Tabs) */}
        {lists.length > 0 && (
          <SegmentedControl
            options={['Todas', 'Ativas', 'Concluídas']}
            selected={selectedFilter}
            onChange={setSelectedFilter}
          />
        )}

        {/* Smart Banner for new users */}
        {lists.length === 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-ios p-4 mb-4 border border-purple-100">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[15px] mb-1">💡 Experimente criar com IA</h4>
                <p className="text-[13px] text-gray-600">
                  Descreva o que precisa e deixe a IA montar a lista para você!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Modal */}
        <CreateListWithAIModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
        />

        {/* Join List Modal */}
        <JoinListModal
          userId={user?.id || ''}
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />

        {/* Receipt Scanner */}
        {showScanner && (
          <ReceiptScanner
            userId={user?.id || ''}
            onSuccess={() => {
              setShowScanner(false);
              toast.success('✅ Histórico atualizado!');
              refreshLists();
            }}
            onCancel={() => setShowScanner(false)}
          />
        )}

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
        {filteredLists.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <svg
                className="h-10 w-10 text-primary"
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
            </div>
            <h3 className="text-[22px] font-bold text-gray-900 mb-2">
              Comece sua primeira lista
            </h3>
            <p className="text-[15px] text-gray-500 mb-6">
              Organize suas compras de forma inteligente
            </p>
            <button
              onClick={() => setShowActionSheet(true)}
              className="text-primary font-semibold text-[17px]"
            >
              Criar Lista →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onClick={() => navigate(`/list/${list.id}`)}
                onDelete={handleDeleteList}
              />
            ))}
          </div>
        )}

        {/* FAB (Floating Action Button) */}
        <button
          onClick={() => setShowActionSheet(true)}
          className="fixed bottom-20 right-6 w-14 h-14 bg-primary rounded-full shadow-ios-lg flex items-center justify-center text-white active:scale-95 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Action Sheet */}
        <ActionSheet
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          options={actionSheetOptions}
        />
      </div>
    </Layout>
  );
};
