import { ShoppingList } from '../../lib/db';
import { formatRelativeDate } from '../../lib/utils';
import { useLocalItems } from '../../hooks/useLocalItems';

interface ListCardProps {
  list: ShoppingList;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const ListCard = ({ list, onClick, onDelete }: ListCardProps) => {
  const { stats } = useLocalItems(list.id);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja realmente excluir a lista "${list.name}"?`)) {
      onDelete(list.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {list.name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {formatRelativeDate(list.updatedAt)}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {stats.total} {stats.total === 1 ? 'item' : 'itens'}
            </span>
            {stats.total > 0 && (
              <span className="text-success font-medium">
                {stats.checked} de {stats.total} comprados
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-error transition-colors p-1"
          aria-label="Excluir lista"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
