import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseLists } from '../hooks/useSupabaseLists';
import { useSupabaseItems } from '../hooks/useSupabaseItems';
import { useAuth } from '../contexts/AuthContext';
import { useListSuggestions } from '../hooks/useListSuggestions';
import { Layout } from '../components/layout/Layout';
import { ItemRow } from '../components/items/ItemRow';
import { ItemModal } from '../components/items/ItemModal';
import { ShareListModal } from '../components/lists/ShareListModal';
import { MembersModal } from '../components/lists/MembersModal';
import { SuggestionsBanner } from '../components/suggestions/SuggestionsBanner';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import type { ShoppingItem } from '../hooks/useSupabaseItems';

export const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getListById, deleteList } = useSupabaseLists();
  const { items, stats, createItem, updateItem, toggleItem, deleteItem } = useSupabaseItems(id || '');

  // Sugestões de IA
  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    fetchSuggestions,
    dismissSuggestions
  } = useListSuggestions(id, items);

  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);

  useEffect(() => {
    let isCancelled = false;

    const loadList = async () => {
      if (!id) {
        navigate('/home');
        return;
      }

      // Aguardar o carregamento da autenticação antes de buscar a lista
      if (authLoading) {
        return;
      }

      // Se não estiver autenticado após carregar, redirecionar para landing
      if (!user) {
        navigate('/');
        return;
      }

      try {
        const foundList = await getListById(id);

        // Não atualizar o estado se o componente foi desmontado
        if (isCancelled) {
          return;
        }

        if (!foundList) {
          console.warn('[ListDetail] List not found:', id);
          toast.error('Lista não encontrada');
          navigate('/home');
          return;
        }
        setList(foundList);
      } catch (error) {
        // Não mostrar erro se o componente foi desmontado
        if (isCancelled) {
          return;
        }

        console.error('[ListDetail] Error loading list:', error);
        toast.error('Erro ao carregar lista');
        navigate('/home');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadList();

    // Cleanup: cancelar operações quando o componente desmontar
    return () => {
      isCancelled = true;
    };
  }, [id, user, authLoading, getListById, navigate]);

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (data: any) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
        toast.success('Item atualizado');
      } else {
        await createItem(data.name, data.quantity, data.unit, data.category);
        toast.success('Item adicionado');
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast.error('Erro ao salvar item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      toast.success('Item excluído');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const handleDeleteList = async () => {
    if (!id) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a lista "${list?.name}"?\n\nEsta ação não pode ser desfeita e todos os itens serão perdidos.`
    );

    if (!confirmDelete) return;

    try {
      await deleteList(id);
      toast.success('Lista excluída com sucesso');
      navigate('/home');
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      toast.error('Erro ao excluir lista');
    }
  };

  const handleNotifyMembers = async () => {
    if (!id || !user) return;

    const loadingToast = toast.loading('Enviando notificações...');

    try {
      const response = await fetch('/api/notify-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId: id,
          listName: list?.name,
          currentUserId: user.id,
        }),
      });

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar notificações');
      }

      if (data.notifiedCount === 0) {
        toast('Nenhum membro para notificar', { icon: 'ℹ️' });
      } else {
        toast.success(
          `${data.notifiedCount} ${data.notifiedCount === 1 ? 'membro notificado' : 'membros notificados'}!`
        );
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Erro ao notificar membros:', error);
      toast.error('Erro ao enviar notificações');
    }
  };

  const handleAddSuggestion = async (suggestion: { name: string; quantity: number; unit: string; category?: string }) => {
    try {
      await createItem(suggestion.name, suggestion.quantity, suggestion.unit, suggestion.category);
      toast.success(`${suggestion.name} adicionado!`);
    } catch (error) {
      console.error('Erro ao adicionar sugestão:', error);
      toast.error('Erro ao adicionar item');
    }
  };

  // Mostrar loading enquanto autentica ou carrega lista
  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    );
  }

  // Se não estiver autenticado, não renderizar nada (redirecionará)
  if (!user) {
    return null;
  }

  if (!list) return null;

  const uncheckedItems = items.filter(item => !item.checked);
  const checkedItems = items.filter(item => item.checked);

  return (
    <Layout showTabBar={false}>
      <Toaster position="top-center" />

      <div className="px-4 py-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary mb-4 active:opacity-70"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[17px] font-medium">Listas</span>
        </button>

        {/* List Title */}
        <div className="mb-3">
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white break-words">{list.name}</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-2">
          {/* AI Suggestions Button */}
          <button
            onClick={fetchSuggestions}
            disabled={suggestionsLoading || items.length === 0}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg active:opacity-70 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-1.5"
            title="Sugestões da IA"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[14px] font-semibold">Sugestões</span>
          </button>

          {/* Notify Members Button */}
          <button
            onClick={handleNotifyMembers}
            className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg active:opacity-70 transition-colors"
            title="Notificar membros sobre atualização"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* Members Button */}
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="p-2 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:opacity-70 transition-colors"
            title="Ver membros"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:opacity-70 transition-colors"
            title="Compartilhar lista"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDeleteList}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg active:opacity-70 transition-colors"
            title="Excluir lista"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[15px] text-gray-500 dark:text-gray-400 mb-6">
          <span>{stats.total} {stats.total === 1 ? 'item' : 'itens'}</span>
          {stats.total > 0 && (
            <>
              <span>·</span>
              <span className="text-success dark:text-green-400">{stats.checked} comprados</span>
            </>
          )}
        </div>

        {/* Add Item Button */}
        <button
          onClick={handleAddItem}
          className="w-full mb-4 h-12 bg-primary text-white rounded-ios text-[17px] font-semibold active:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Item
        </button>

        {/* AI Suggestions Banner */}
        <SuggestionsBanner
          suggestions={suggestions}
          loading={suggestionsLoading}
          error={suggestionsError}
          onAddSuggestion={handleAddSuggestion}
          onDismiss={dismissSuggestions}
          onFetchSuggestions={fetchSuggestions}
        />

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <svg className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-1">Nenhum item</h3>
            <p className="text-[15px] text-gray-500 dark:text-gray-400">Adicione itens à sua lista</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-ios overflow-hidden">
                {uncheckedItems.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            )}

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <div>
                <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                  Comprados
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-ios overflow-hidden opacity-60">
                  {checkedItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Modal */}
      <ItemModal
        isOpen={isModalOpen}
        item={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSaveItem}
      />

      {/* Share Modal */}
      <ShareListModal
        listId={id || ''}
        listName={list.name}
        userId={user?.id || ''}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Members Modal */}
      <MembersModal
        listId={id || ''}
        listName={list.name}
        currentUserId={user?.id || ''}
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
      />
    </Layout>
  );
};
