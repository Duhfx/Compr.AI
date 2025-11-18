// src/components/lists/MembersModal.tsx
// Modal para visualizar e gerenciar membros da lista

import { useState, useEffect } from 'react';
import { getListOwner, removeMember } from '../../lib/sharing';
import { supabase } from '../../lib/supabase';
import { ErrorMessage } from '../ui/ErrorMessage';

interface Member {
  id: string;
  userId: string;
  joinedAt: Date;
  lastSeenAt?: Date;
  nickname?: string;
}

interface MembersModalProps {
  listId: string;
  listName: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  listId,
  listName,
  currentUserId,
  isOpen,
  onClose,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerNickname, setOwnerNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = ownerId === currentUserId;

  // Carregar membros e dono
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Buscar membros com nicknames da view
        const { data: membersWithNames, error: membersError } = await supabase
          .from('list_members_with_names')
          .select('*')
          .eq('list_id', listId)
          .eq('is_active', true)
          .order('joined_at', { ascending: true });

        if (membersError) {
          console.error('Error loading members:', membersError);
          throw membersError;
        }

        // Converter para formato Member
        const membersData: Member[] = (membersWithNames || []).map(m => ({
          id: m.id,
          userId: m.user_id,
          joinedAt: new Date(m.joined_at),
          lastSeenAt: m.last_seen_at ? new Date(m.last_seen_at) : undefined,
          nickname: m.nickname || undefined,
        }));

        // Buscar dono da lista
        const ownerData = await getListOwner(listId);

        // Buscar nickname do dono
        let ownerNick = null;
        if (ownerData) {
          const { data: ownerProfile } = await supabase
            .from('user_profiles')
            .select('nickname')
            .eq('user_id', ownerData)
            .single();

          ownerNick = ownerProfile?.nickname || null;
        }

        setMembers(membersData);
        setOwnerId(ownerData);
        setOwnerNickname(ownerNick);
      } catch (error) {
        console.error('Error loading members:', error);
        setError('Erro ao carregar membros');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, listId]);

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da lista?')) {
      return;
    }

    try {
      setRemovingId(memberUserId);
      setError(null);
      await removeMember(listId, memberUserId, currentUserId);

      // Atualizar lista local
      setMembers(members.filter(m => m.userId !== memberUserId));
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error instanceof Error ? error.message : 'Erro ao remover membro');
    } finally {
      setRemovingId(null);
    }
  };

  const formatUserId = (userId: string) => {
    // Mostrar apenas os primeiros e últimos caracteres do ID
    if (userId.length <= 12) return userId;
    return `${userId.substring(0, 8)}...${userId.substring(userId.length - 4)}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-ios max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-[22px] font-bold text-gray-900 dark:text-white">Membros</h2>
            <p className="text-[15px] text-gray-600 dark:text-gray-400 mt-1">{listName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 active:opacity-70"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ErrorMessage message={error} className="mb-4" />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Carregando membros...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Dono da lista */}
              <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-ios p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                        {ownerNickname || 'Dono da Lista'}
                      </p>
                      {ownerId === currentUserId && (
                        <p className="text-[12px] text-primary dark:text-primary-400">
                          Você
                        </p>
                      )}
                      <p className="text-[13px] text-gray-500 dark:text-gray-500 font-mono text-xs">
                        ID: {formatUserId(ownerId || '')}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary text-white text-[12px] font-semibold rounded-full">
                    DONO
                  </span>
                </div>
              </div>

              {/* Membros */}
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-[15px] text-gray-500 dark:text-gray-400">
                    Nenhum outro membro na lista
                  </p>
                </div>
              ) : (
                members.map((member) => {
                  const isMemberOwner = member.userId === ownerId;
                  const isCurrentUser = member.userId === currentUserId;

                  // Não mostrar o dono novamente na lista de membros
                  if (isMemberOwner) return null;

                  return (
                    <div
                      key={member.id}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-ios p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center font-semibold">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                              {member.nickname || 'Usuário Anônimo'}
                            </p>
                            {isCurrentUser && (
                              <p className="text-[12px] text-primary dark:text-primary-400">
                                Você
                              </p>
                            )}
                            <p className="text-[13px] text-gray-500 dark:text-gray-500 font-mono text-xs truncate">
                              ID: {formatUserId(member.userId)}
                            </p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                              Entrou {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Botão de remover (apenas para dono) */}
                        {isOwner && !isCurrentUser && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removingId === member.userId}
                            className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg active:opacity-70 transition-colors disabled:opacity-50"
                            title="Remover membro"
                          >
                            {removingId === member.userId ? (
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-[13px] text-gray-500 dark:text-gray-400 text-center mb-4">
            {isOwner ? (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Você é o dono desta lista e pode remover membros
              </>
            ) : (
              `Total: ${members.filter(m => m.userId !== ownerId).length + 1} ${members.filter(m => m.userId !== ownerId).length + 1 === 1 ? 'pessoa' : 'pessoas'}`
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full h-12 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-ios text-[17px] font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 active:opacity-70 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
