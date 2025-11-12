import { ShoppingItem } from '../../lib/db';

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export const ItemRow = ({ item, onToggle, onEdit, onDelete }: ItemRowProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja realmente excluir "${item.name}"?`)) {
      onDelete(item.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        item.checked
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-300'
      }`}
    >
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id)}
        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
      />

      <div className="flex-1" onClick={handleEdit}>
        <div className="flex items-baseline gap-2">
          <span
            className={`font-medium ${
              item.checked ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {item.name}
          </span>
          <span className="text-sm text-gray-500">
            {item.quantity} {item.unit}
          </span>
        </div>
        {item.category && (
          <span className="text-xs text-gray-400">{item.category}</span>
        )}
      </div>

      <div className="flex gap-1">
        <button
          onClick={handleEdit}
          className="text-gray-400 hover:text-primary-600 transition-colors p-1"
          aria-label="Editar item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>

        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-error transition-colors p-1"
          aria-label="Excluir item"
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
