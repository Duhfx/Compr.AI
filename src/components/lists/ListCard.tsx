import type { ShoppingList } from '../../lib/db';
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
      className="bg-white border-b border-gray-150 px-4 py-3 active:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[17px] font-semibold text-gray-900 truncate">
              {list.name}
            </h3>
            {/* iOS Chevron */}
            <svg
              className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>

          <div className="flex items-center gap-3 text-[13px] text-gray-500">
            <span>
              {stats.total} {stats.total === 1 ? 'item' : 'itens'}
            </span>
            {stats.total > 0 && (
              <>
                <span>·</span>
                <span className="text-success">
                  {stats.checked}/{stats.total} comprados
                </span>
              </>
            )}
            <span>·</span>
            <span>{formatRelativeDate(list.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
