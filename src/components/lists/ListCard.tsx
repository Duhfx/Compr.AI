import type { ShoppingList } from '../../hooks/useSupabaseLists';
import { useSupabaseItems } from '../../hooks/useSupabaseItems';

interface ListCardProps {
  list: ShoppingList;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const ListCard = ({ list, onClick }: ListCardProps) => {
  const { stats } = useSupabaseItems(list.id);
  const progress = stats.total > 0 ? (stats.checked / stats.total) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-ios dark:shadow-none dark:border dark:border-gray-700 active:shadow-ios-pressed transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white truncate mb-0.5">
            {list.name}
          </h3>
          <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
            <span>
              {stats.total} {stats.total === 1 ? 'item' : 'itens'}
            </span>
            {stats.total > 0 && (
              <>
                <span>•</span>
                <span className="text-success dark:text-green-400 font-medium">
                  {stats.checked}/{stats.total} ✓
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 ml-2"
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
          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-success dark:bg-green-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className="flex items-center justify-end mt-1">
              <span className="text-[10px] text-success dark:text-green-400 font-medium">
                ✓ Completo
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
