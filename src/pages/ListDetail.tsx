import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalLists } from '../hooks/useLocalLists';
import { useLocalItems } from '../hooks/useLocalItems';
import { Layout } from '../components/layout/Layout';
import { ItemRow } from '../components/items/ItemRow';
import { ItemModal } from '../components/items/ItemModal';
import toast, { Toaster } from 'react-hot-toast';
import type { ShoppingItem } from '../lib/db';

export const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getListById } = useLocalLists();
  const { items, stats, createItem, updateItem, toggleItem, deleteItem } = useLocalItems(id || '');

  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);

  useEffect(() => {
    const loadList = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        const foundList = await getListById(id);
        if (!foundList) {
          toast.error('Lista não encontrada');
          navigate('/');
          return;
        }
        setList(foundList);
      } catch (error) {
        console.error('Erro ao carregar lista:', error);
        toast.error('Erro ao carregar lista');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadList();
  }, [id, getListById, navigate]);

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </Layout>
    );
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
        <h1 className="text-[28px] font-bold text-gray-900 mb-2">{list.name}</h1>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[15px] text-gray-500 mb-6">
          <span>{stats.total} {stats.total === 1 ? 'item' : 'itens'}</span>
          {stats.total > 0 && (
            <>
              <span>·</span>
              <span className="text-success">{stats.checked} comprados</span>
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

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <svg className="h-20 w-20 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-[17px] font-semibold text-gray-900 mb-1">Nenhum item</h3>
            <p className="text-[15px] text-gray-500">Adicione itens à sua lista</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <div className="bg-white rounded-ios overflow-hidden">
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
                <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                  Comprados
                </h2>
                <div className="bg-white rounded-ios overflow-hidden opacity-60">
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

      {/* Modal */}
      <ItemModal
        isOpen={isModalOpen}
        item={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSaveItem}
      />
    </Layout>
  );
};
