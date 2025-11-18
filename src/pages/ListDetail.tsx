import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseLists } from '../hooks/useSupabaseLists';
import { useSupabaseItems } from '../hooks/useSupabaseItems';
import { useAuth } from '../contexts/AuthContext';
import { useListSuggestions } from '../hooks/useListSuggestions';
import { getUserPermission } from '../lib/sharing';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/layout/Layout';
import { ItemRow } from '../components/items/ItemRow';
import { ItemModal } from '../components/items/ItemModal';
import { ShareListModal } from '../components/lists/ShareListModal';
import { MembersModal } from '../components/lists/MembersModal';
import { SuggestionsBanner } from '../components/suggestions/SuggestionsBanner';
import { PredictionModal } from '../components/predictions/PredictionModal';
import { ChatInterface } from '../components/chat/ChatInterface';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles, MoreVertical, Bell, Users, Share2, Trash2, Edit2, UserCheck, TrendingUp, MessageCircle } from 'lucide-react';
import type { ShoppingItem } from '../hooks/useSupabaseItems';

export const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getListById, deleteList, updateList } = useSupabaseLists();
  const { items, stats, createItem, updateItem, toggleItem, deleteItem, restoreItem, loadDeletedItems } = useSupabaseItems(id || '');

  // Sugestões de IA
  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    fetchSuggestions,
    dismissSuggestions,
    removeSuggestion
  } = useListSuggestions(id, items);

  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);
  const [deletedItems, setDeletedItems] = useState<ShoppingItem[]>([]);
  const [showDeletedSection, setShowDeletedSection] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [userPermission, setUserPermission] = useState<'owner' | 'edit' | 'readonly' | null>(null);
  const [ownerNickname, setOwnerNickname] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  // Carregar permissões do usuário e informações de compartilhamento
  useEffect(() => {
    const loadPermissionsAndOwner = async () => {
      if (!id || !user?.id) return;

      try {
        const permission = await getUserPermission(id, user.id);
        setUserPermission(permission);

        // Verificar se a lista é compartilhada (se não for owner)
        if (permission !== 'owner') {
          setIsShared(true);

          // Buscar informações do dono da lista
          const { data: listData } = await supabase
            .from('shopping_lists')
            .select('user_id')
            .eq('id', id)
            .single();

          if (listData?.user_id) {
            // Buscar perfil do dono
            const { data: ownerProfile } = await supabase
              .from('user_profiles')
              .select('nickname')
              .eq('user_id', listData.user_id)
              .single();

            if (ownerProfile?.nickname) {
              setOwnerNickname(ownerProfile.nickname);
            }
          }
        } else {
          setIsShared(false);
          setOwnerNickname(null);
        }
      } catch (error) {
        console.error('[ListDetail] Error loading permissions:', error);
      }
    };

    loadPermissionsAndOwner();
  }, [id, user?.id]);

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

  const handleEditName = () => {
    setEditedName(list?.name || '');
    setIsEditingName(true);
    setShowActionsMenu(false);
  };

  const handleSaveEditedName = async () => {
    if (!id || !editedName.trim()) return;

    if (editedName.trim() === list?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateList(id, { name: editedName.trim() });
      setList({ ...list, name: editedName.trim() });
      toast.success('Nome da lista atualizado!');
      setIsEditingName(false);
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Erro ao atualizar nome da lista');
    }
  };

  const handleNotifyMembers = async () => {
    if (!id || !user) return;

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

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar notificações');
      }

      // Notificação enviada silenciosamente, sem toast
    } catch (error) {
      console.error('Erro ao notificar membros:', error);
      // Erro também é silencioso, apenas logado
    }
  };

  const handleAddSuggestion = async (suggestion: { name: string; quantity: number; unit: string; category?: string }) => {
    try {
      await createItem(suggestion.name, suggestion.quantity, suggestion.unit, suggestion.category);
      toast.success(`${suggestion.name} adicionado!`);
      // Remove a sugestão da lista após adicionar com sucesso
      removeSuggestion(suggestion.name);
    } catch (error) {
      console.error('Erro ao adicionar sugestão:', error);
      toast.error('Erro ao adicionar item');
    }
  };

  const handleToggleDeletedSection = async () => {
    if (!showDeletedSection) {
      // Carregar itens deletados ao abrir a seção
      setLoadingDeleted(true);
      try {
        const deleted = await loadDeletedItems();
        setDeletedItems(deleted);
      } catch (error) {
        console.error('Erro ao carregar itens excluídos:', error);
        toast.error('Erro ao carregar itens excluídos');
      } finally {
        setLoadingDeleted(false);
      }
    }
    setShowDeletedSection(!showDeletedSection);
  };

  const handleRestoreItem = async (itemId: string) => {
    try {
      await restoreItem(itemId);
      toast.success('Item restaurado');
      // Remover da lista de deletados
      setDeletedItems(deletedItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Erro ao restaurar item:', error);
      toast.error('Erro ao restaurar item');
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) return;

    try {
      await createItem(quickAddName.trim(), 1, 'un');
      setQuickAddName('');
      setQuickAddOpen(false);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }

      toast.success('Item adicionado!');
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
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

      <div className="px-4 py-4 pb-24">
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

        {/* Shared List Indicator */}
        {isShared && (
          <div className="mb-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-lg flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-indigo-800 dark:text-indigo-200">
                {ownerNickname ? (
                  <>
                    Lista compartilhada por <span className="font-semibold">{ownerNickname}</span>
                  </>
                ) : (
                  'Lista compartilhada'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Header: Title + Actions (Compacto) */}
        <div className="mb-3">
          {/* Title and Actions Row - Compacto */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-bold text-gray-900 dark:text-white truncate leading-tight">
                {list.name}
              </h1>
              {/* Stats inline */}
              <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                <span className="font-medium">{stats.total} {stats.total === 1 ? 'item' : 'itens'}</span>
                {stats.total > 0 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{stats.checked}/{stats.total} ✓</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions compactos */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* AI Suggestions Button - Icon only */}
              <button
                onClick={fetchSuggestions}
                disabled={suggestionsLoading || items.length === 0}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 text-white rounded-full active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
                title="Sugestões da IA"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              {/* More Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="w-10 h-10 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full active:scale-95 transition-all flex items-center justify-center"
                  title="Mais ações"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {showActionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActionsMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                      {/* Editar nome - apenas owner e edit */}
                      {(userPermission === 'owner' || userPermission === 'edit') && (
                        <button
                          onClick={handleEditName}
                          className="w-full px-4 py-3 text-left text-[15px] font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 flex items-center gap-3 transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-primary dark:text-indigo-400" />
                          Editar nome
                        </button>
                      )}

                      {/* Notificar membros - todos podem */}
                      <button
                        onClick={() => {
                          handleNotifyMembers();
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-[15px] font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 flex items-center gap-3 transition-colors"
                      >
                        <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        Notificar membros
                      </button>

                      {/* Ver membros - todos podem */}
                      <button
                        onClick={() => {
                          setIsMembersModalOpen(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-[15px] font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 flex items-center gap-3 transition-colors"
                      >
                        <Users className="w-5 h-5 text-primary dark:text-indigo-400" />
                        Ver membros
                      </button>

                      {/* Ver Previsão - todos podem */}
                      <button
                        onClick={() => {
                          setIsPredictionModalOpen(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-[15px] font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 flex items-center gap-3 transition-colors"
                        disabled={items.length === 0}
                      >
                        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Ver Previsão de Gastos
                      </button>

                      {/* Chat com IA - todos podem */}
                      <button
                        onClick={() => {
                          setIsChatOpen(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-[15px] font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 flex items-center gap-3 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Chat com IA
                      </button>

                      {/* Compartilhar - apenas owner e edit */}
                      {(userPermission === 'owner' || userPermission === 'edit') && (
                        <button
                          onClick={() => {
                            setIsShareModalOpen(true);
                            setShowActionsMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-[15px] font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700"
                        >
                          <Share2 className="w-5 h-5 text-primary dark:text-indigo-400" />
                          Compartilhar lista
                        </button>
                      )}

                      {/* Excluir - apenas owner */}
                      {userPermission === 'owner' && (
                        <button
                          onClick={() => {
                            handleDeleteList();
                            setShowActionsMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-[15px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          Excluir lista
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Item (inline) */}
        <div className="mb-4">
          {!quickAddOpen ? (
            <button
              onClick={() => setQuickAddOpen(true)}
              className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-left px-4 text-gray-500 dark:text-gray-400 text-[15px] active:bg-gray-100 dark:active:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar item rápido...
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3">
              <input
                autoFocus
                type="text"
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickAdd();
                  }
                }}
                placeholder="Ex: Leite 2L"
                className="w-full bg-transparent text-[15px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none mb-2"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                enterKeyHint="done"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setQuickAddOpen(false);
                    setQuickAddName('');
                  }}
                  className="flex-1 h-9 text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleQuickAdd}
                  disabled={!quickAddName.trim()}
                  className="flex-1 h-9 bg-primary text-white text-[14px] font-semibold rounded-lg active:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </div>

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

            {/* Deleted Items Section */}
            <div className="mt-8">
              <button
                onClick={handleToggleDeletedSection}
                className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg active:opacity-70 transition-all"
              >
                <h2 className="text-[15px] font-semibold text-gray-600 dark:text-gray-400">
                  Excluídos
                </h2>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    showDeletedSection ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDeletedSection && (
                <div className="mt-3">
                  {loadingDeleted ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Carregando...
                    </div>
                  ) : deletedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[15px]">
                      Nenhum item excluído
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-ios overflow-hidden opacity-50">
                      {deletedItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-gray-150 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[17px] text-gray-900 dark:text-white line-through truncate">
                              {item.name}
                            </h4>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400">
                              {item.quantity} {item.unit}
                              {item.category && ` · ${item.category}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRestoreItem(item.id)}
                            className="px-3 py-1.5 bg-primary text-white text-[14px] font-medium rounded-lg active:opacity-70 transition-opacity"
                          >
                            Restaurar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Add Item Button (Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-screen-sm mx-auto px-4 pb-safe">
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button
              onClick={handleAddItem}
              className="w-full h-11 bg-primary text-white rounded-full text-[15px] font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Item Detalhado
            </button>
          </div>
        </div>
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

      {/* Prediction Modal */}
      <PredictionModal
        isOpen={isPredictionModalOpen}
        onClose={() => setIsPredictionModalOpen(false)}
        items={items}
        userId={user?.id || ''}
        listName={list?.name || ''}
      />

      {/* Chat Interface */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        userId={user?.id || ''}
        listId={id}
        listName={list?.name}
      />

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Editar nome da lista
              </h2>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEditedName();
                  }
                }}
                placeholder="Nome da lista"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsEditingName(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedName}
                disabled={!editedName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
