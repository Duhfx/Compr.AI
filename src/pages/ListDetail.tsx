import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalLists } from '../hooks/useLocalLists';
import { useLocalItems } from '../hooks/useLocalItems';
import { Layout } from '../components/layout/Layout';
import { ItemRow } from '../components/items/ItemRow';
import { ItemModal } from '../components/items/ItemModal';
import { ShoppingItem } from '../lib/db';

export const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getListById } = useLocalLists();
  const { items, stats, createItem, updateItem, toggleItem, deleteItem } = useLocalItems(id || '');

  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | undefined>(undefined);
  const [quickAddName, setQuickAddName] = useState('');

  useEffect(() => {
    const loadList = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        const foundList = await getListById(id);
        if (!foundList) {
          alert('Lista não encontrada');
          navigate('/');
          return;
        }
        setList(foundList);
      } catch (error) {
        console.error('Erro ao carregar lista:', error);
        alert('Erro ao carregar lista');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadList();
  }, [id, getListById, navigate]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;

    try {
      await createItem(quickAddName.trim());
      setQuickAddName('');
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao adicionar item');
    }
  };

  const handleOpenModal = (item?: ShoppingItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(undefined);
  };

  const handleSaveItem = async (data: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
  }) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
      } else {
        await createItem(data.name, data.quantity, data.unit, data.category);
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await toggleItem(itemId);
    } catch (error) {
      console.error('Erro ao marcar item:', error);
      alert('Erro ao marcar item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item');
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
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Voltar
          </button>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">{list.name}</h2>

          {stats.total > 0 && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                {stats.checked} de {stats.total} itens comprados
              </span>
              {stats.checked > 0 && (
                <div className="flex-1 max-w-xs">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success transition-all duration-300"
                      style={{ width: `${(stats.checked / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <input
              type="text"
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              placeholder="Adicionar item rápido..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Detalhado
            </button>
          </form>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20 mx-auto text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Lista vazia
            </h3>
            <p className="text-gray-500">
              Adicione itens à sua lista de compras
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {uncheckedItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  A Comprar ({uncheckedItems.length})
                </h3>
                <div className="space-y-2">
                  {uncheckedItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onEdit={handleOpenModal}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {checkedItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Comprados ({checkedItems.length})
                </h3>
                <div className="space-y-2">
                  {checkedItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onEdit={handleOpenModal}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <ItemModal
          isOpen={isModalOpen}
          item={editingItem}
          onClose={handleCloseModal}
          onSave={handleSaveItem}
        />
      </div>
    </Layout>
  );
};
