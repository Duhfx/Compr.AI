// src/components/lists/MemberAvatars.tsx
// Exibe avatares dos membros de uma lista compartilhada

import { useEffect, useState } from 'react';
import { getListMembers } from '../../lib/sharing';

interface Member {
  id: string;
  deviceId: string;
  nickname: string;
  joinedAt: Date;
  lastSeenAt?: Date;
}

interface MemberAvatarsProps {
  listId: string;
  maxVisible?: number;
}

export const MemberAvatars: React.FC<MemberAvatarsProps> = ({
  listId,
  maxVisible = 3,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await getListMembers(listId);
        setMembers(data);
      } catch (error) {
        console.error('Error loading members:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [listId]);

  if (loading) {
    return (
      <div className="flex -space-x-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (members.length === 0) return null;

  const visibleMembers = members.slice(0, maxVisible);
  const hiddenCount = members.length - maxVisible;

  // Gera cor consistente baseada no deviceId
  const getColorFromId = (id: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Pega as iniciais do nickname
  const getInitials = (nickname: string) => {
    return nickname
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            className={`
              w-8 h-8 rounded-full border-2 border-white flex items-center justify-center
              text-white text-xs font-semibold
              ${getColorFromId(member.deviceId)}
            `}
            title={`${member.nickname} (${member.lastSeenAt ? 'Online' : 'Offline'})`}
          >
            {getInitials(member.nickname)}
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold"
            title={`+${hiddenCount} ${hiddenCount === 1 ? 'pessoa' : 'pessoas'}`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
    </div>
  );
};
