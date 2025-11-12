import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalLists } from '../hooks/useLocalLists';
import { Layout } from '../components/layout/Layout';
import { ListCard } from '../components/lists/ListCard';

export const Home = () => {
  const navigate = useNavigate();
  const { lists, loading, createList, deleteList } = useLocalLists();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const newList = await createList(newListName.trim());
      setNewListName('');
      setIsCreating(false);
      navigate(`/list/${newList.id}`);
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      alert('Erro ao criar lista. Tente novamente.');
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList(id);
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      alert('Erro ao excluir lista. Tente novamente.');
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Minhas Listas</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Nova Lista
          </button>
        </div>

        {isCreating && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <form onSubmit={handleCreateList}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Nome da lista (ex: Feira da Semana)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewListName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {lists.length === 0 ? (
          <div className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma lista criada
            </h3>
            <p className="text-gray-500 mb-6">
              Crie sua primeira lista de compras para começar
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Criar Primeira Lista
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onClick={() => navigate(`/list/${list.id}`)}
                onDelete={handleDeleteList}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
