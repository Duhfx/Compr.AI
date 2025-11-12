// src/components/lists/SharedListBadge.tsx
// Badge visual para indicar que uma lista é compartilhada

interface SharedListBadgeProps {
  memberCount?: number;
  permission?: 'edit' | 'readonly';
  size?: 'sm' | 'md';
}

export const SharedListBadge: React.FC<SharedListBadgeProps> = ({
  memberCount,
  permission = 'edit',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${permission === 'edit' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}
          ${sizeClasses[size]}
        `}
      >
        <svg
          className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        Compartilhada
        {memberCount !== undefined && memberCount > 0 && (
          <span className="font-semibold">({memberCount})</span>
        )}
      </span>

      {permission === 'readonly' && (
        <span
          className={`
            inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 font-medium
            ${sizeClasses[size]}
          `}
        >
          <svg
            className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Somente Leitura
        </span>
      )}
    </div>
  );
};
