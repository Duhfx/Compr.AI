// src/hooks/useRealtimeSync.ts
// Hook para sincronização em tempo real com Supabase Realtime

import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import type { Database } from '../types/database';

type ShoppingItemRow = Database['public']['Tables']['shopping_items']['Row'];

interface UseRealtimeSyncOptions {
  listId: string;
  enabled?: boolean;
  onItemAdded?: (item: ShoppingItemRow) => void;
  onItemUpdated?: (item: ShoppingItemRow) => void;
  onItemDeleted?: (itemId: string) => void;
}

export const useRealtimeSync = ({
  listId,
  enabled = true,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
}: UseRealtimeSyncOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !listId) return;

    // Criar canal de realtime para a lista específica
    const channel = supabase
      .channel(`list:${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${listId}`,
        },
        async (payload) => {
          const newItem = payload.new as ShoppingItemRow;

          // Atualizar IndexedDB local
          await db.shoppingItems.add({
            id: newItem.id,
            listId: newItem.list_id,
            name: newItem.name,
            quantity: newItem.quantity,
            unit: newItem.unit,
            category: newItem.category || undefined,
            checked: newItem.checked,
            createdAt: new Date(newItem.created_at),
            updatedAt: new Date(newItem.updated_at),
          });

          // Notificar callback
          onItemAdded?.(newItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${listId}`,
        },
        async (payload) => {
          const updatedItem = payload.new as ShoppingItemRow;

          // Atualizar IndexedDB local
          await db.shoppingItems.update(updatedItem.id, {
            name: updatedItem.name,
            quantity: updatedItem.quantity,
            unit: updatedItem.unit,
            category: updatedItem.category || undefined,
            checked: updatedItem.checked,
            updatedAt: new Date(updatedItem.updated_at),
          });

          // Notificar callback
          onItemUpdated?.(updatedItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${listId}`,
        },
        async (payload) => {
          const deletedItem = payload.old as ShoppingItemRow;

          // Remover do IndexedDB local
          await db.shoppingItems.delete(deletedItem.id);

          // Notificar callback
          onItemDeleted?.(deletedItem.id);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to list:${listId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error subscribing to list:${listId}`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`[Realtime] Subscription timed out for list:${listId}`);
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe ao desmontar
    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from list:${listId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [listId, enabled, onItemAdded, onItemUpdated, onItemDeleted]);

  return {
    isConnected: channelRef.current?.state === 'joined',
  };
};

// Hook para sincronizar alterações da lista (nome, etc)
export const useRealtimeListSync = (listId: string, enabled = true) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !listId) return;

    const channel = supabase
      .channel(`list-meta:${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopping_lists',
          filter: `id=eq.${listId}`,
        },
        async (payload) => {
          const updatedList = payload.new as Database['public']['Tables']['shopping_lists']['Row'];

          // Atualizar IndexedDB local
          await db.shoppingLists.update(updatedList.id, {
            name: updatedList.name,
            updatedAt: new Date(updatedList.updated_at),
            syncedAt: new Date(),
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [listId, enabled]);
};
