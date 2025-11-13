import type { ShoppingList } from '../../hooks/useSupabaseLists';
import { formatRelativeDate } from '../../lib/utils';
import { useSupabaseItems } from '../../hooks/useSupabaseItems';

interface ListCardProps {
  list: ShoppingList;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const ListCard = ({ list, onClick }: ListCardProps) => {
  const { stats } = useSupabaseItems(list.id);
  const progress = stats.total > 0 ? (stats.checked / stats.total) * 100 : 0;

  // Emoji baseado no nome da lista
  const getListEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('feira') || lowerName.includes('mercado')) return '🛒';
    if (lowerName.includes('casa') || lowerName.includes('lar')) return '🏠';
    if (lowerName.includes('farmácia') || lowerName.includes('remédio')) return '💊';
    if (lowerName.includes('pet') || lowerName.includes('cachorro') || lowerName.includes('gato')) return '🐾';
    if (lowerName.includes('festa') || lowerName.includes('churrasco')) return '🎉';
    return '📝';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-ios p-4 shadow-ios active:shadow-ios-pressed transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
            {getListEmoji(list.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-semibold text-gray-900 truncate mb-0.5">
              {list.name}
            </h3>
            <div className="flex items-center gap-2 text-[13px] text-gray-500">
              <span>
                {stats.total} {stats.total === 1 ? 'item' : 'itens'}
              </span>
              {stats.total > 0 && (
                <>
                  <span>•</span>
                  <span className="text-success">
                    {stats.checked} comprados
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0"
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

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="relative">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-gray-400">
              {formatRelativeDate(list.updatedAt)}
            </span>
            {progress === 100 && (
              <span className="text-[11px] text-success font-medium">
                ✓ Completo
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
