// src/hooks/useSync.ts
// Hook para sincronização de listas e itens com Supabase

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import type { Database } from '../types/database';

type ShoppingListRow = Database['public']['Tables']['shopping_lists']['Row'];
type ShoppingItemRow = Database['public']['Tables']['shopping_items']['Row'];

interface SyncResult {
  success: boolean;
  listsUploaded: number;
  listsDownloaded: number;
  itemsUploaded: number;
  itemsDownloaded: number;
  error?: string;
}

export const useSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload de listas locais para Supabase
   */
  const uploadLists = useCallback(async (deviceId: string): Promise<number> => {
    const localLists = await db.shoppingLists
      .where('isLocal')
      .equals(1)
      .toArray();

    let uploaded = 0;

    for (const list of localLists) {
      try {
        const { error } = await supabase
          .from('shopping_lists')
          .upsert({
            id: list.id,
            device_id: deviceId,
            name: list.name,
            created_at: list.createdAt.toISOString(),
            updated_at: list.updatedAt.toISOString(),
          });

        if (error) {
          console.error(`Error uploading list ${list.id}:`, error);
          continue;
        }

        // Marcar como sincronizada
        await db.shoppingLists.update(list.id, {
          isLocal: false,
          syncedAt: new Date(),
        });

        uploaded++;
      } catch (err) {
        console.error(`Exception uploading list ${list.id}:`, err);
      }
    }

    return uploaded;
  }, []);

  /**
   * Upload de itens locais para Supabase
   */
  const uploadItems = useCallback(async (): Promise<number> => {
    const localLists = await db.shoppingLists.toArray();
    let uploaded = 0;

    for (const list of localLists) {
      const items = await db.shoppingItems
        .where('listId')
        .equals(list.id)
        .toArray();

      for (const item of items) {
        try {
          const { error } = await supabase
            .from('shopping_items')
            .upsert({
              id: item.id,
              list_id: item.listId,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category || null,
              checked: item.checked,
              created_at: item.createdAt.toISOString(),
              updated_at: item.updatedAt.toISOString(),
            });

          if (!error) {
            uploaded++;
          }
        } catch (err) {
          console.error(`Exception uploading item ${item.id}:`, err);
        }
      }
    }

    return uploaded;
  }, []);

  /**
   * Download de listas do Supabase
   * Inclui listas próprias e listas compartilhadas
   */
  const downloadLists = useCallback(async (deviceId: string): Promise<number> => {
    try {
      // 1. Buscar listas próprias
      const { data: ownLists, error: ownError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('device_id', deviceId);

      if (ownError) {
        console.error('Error downloading own lists:', ownError);
        throw ownError;
      }

      // 2. Buscar listas compartilhadas (onde sou membro)
      const { data: memberships, error: memberError } = await supabase
        .from('list_members')
        .select(`
          list_id,
          shopping_lists (*)
        `)
        .eq('device_id', deviceId)
        .eq('is_active', true);

      if (memberError) {
        console.error('Error downloading shared lists:', memberError);
        throw memberError;
      }

      // Combinar listas próprias e compartilhadas
      const allLists = [
        ...(ownLists || []),
        ...(memberships?.map((m: any) => m.shopping_lists).filter(Boolean) || []),
      ];

      let downloaded = 0;

      for (const list of allLists) {
        const listData = list as ShoppingListRow;

        // Verificar se já existe localmente
        const existing = await db.shoppingLists.get(listData.id);

        if (!existing) {
          // Adicionar nova lista
          await db.shoppingLists.add({
            id: listData.id,
            name: listData.name,
            createdAt: new Date(listData.created_at),
            updatedAt: new Date(listData.updated_at),
            syncedAt: new Date(),
            isLocal: false,
          });
          downloaded++;
        } else {
          // Atualizar se for mais recente
          const remoteUpdatedAt = new Date(listData.updated_at);
          if (remoteUpdatedAt > existing.updatedAt) {
            await db.shoppingLists.update(listData.id, {
              name: listData.name,
              updatedAt: remoteUpdatedAt,
              syncedAt: new Date(),
            });
          }
        }
      }

      return downloaded;
    } catch (err) {
      console.error('Error in downloadLists:', err);
      throw err;
    }
  }, []);

  /**
   * Download de itens do Supabase
   */
  const downloadItems = useCallback(async (): Promise<number> => {
    const localLists = await db.shoppingLists.toArray();
    let downloaded = 0;

    for (const list of localLists) {
      try {
        const { data: items, error } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('list_id', list.id);

        if (error) {
          console.error(`Error downloading items for list ${list.id}:`, error);
          continue;
        }

        if (!items) continue;

        for (const item of items) {
          const itemData = item as ShoppingItemRow;
          const existing = await db.shoppingItems.get(itemData.id);

          if (!existing) {
            // Adicionar novo item
            await db.shoppingItems.add({
              id: itemData.id,
              listId: itemData.list_id,
              name: itemData.name,
              quantity: itemData.quantity,
              unit: itemData.unit,
              category: itemData.category || undefined,
              checked: itemData.checked,
              createdAt: new Date(itemData.created_at),
              updatedAt: new Date(itemData.updated_at),
            });
            downloaded++;
          } else {
            // Atualizar se for mais recente
            const remoteUpdatedAt = new Date(itemData.updated_at);
            if (remoteUpdatedAt > existing.updatedAt) {
              await db.shoppingItems.update(itemData.id, {
                name: itemData.name,
                quantity: itemData.quantity,
                unit: itemData.unit,
                category: itemData.category || undefined,
                checked: itemData.checked,
                updatedAt: remoteUpdatedAt,
              });
            }
          }
        }
      } catch (err) {
        console.error(`Exception downloading items for list ${list.id}:`, err);
      }
    }

    return downloaded;
  }, []);

  /**
   * Sincronização completa (bidirecional)
   */
  const sync = useCallback(async (deviceId: string): Promise<SyncResult> => {
    if (!deviceId) {
      return {
        success: false,
        listsUploaded: 0,
        listsDownloaded: 0,
        itemsUploaded: 0,
        itemsDownloaded: 0,
        error: 'Device ID is required',
      };
    }

    setSyncing(true);
    setError(null);

    try {
      // 1. Upload: enviar mudanças locais para o servidor
      const listsUploaded = await uploadLists(deviceId);
      const itemsUploaded = await uploadItems();

      // 2. Download: buscar mudanças do servidor
      const listsDownloaded = await downloadLists(deviceId);
      const itemsDownloaded = await downloadItems();

      // 3. Atualizar timestamp de sincronização
      const now = new Date();
      setLastSyncAt(now);

      // 4. Atualizar dispositivo no servidor
      await supabase
        .from('devices')
        .update({ last_seen_at: now.toISOString() })
        .eq('id', deviceId);

      return {
        success: true,
        listsUploaded,
        listsDownloaded,
        itemsUploaded,
        itemsDownloaded,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Sync error:', err);

      return {
        success: false,
        listsUploaded: 0,
        listsDownloaded: 0,
        itemsUploaded: 0,
        itemsDownloaded: 0,
        error: errorMessage,
      };
    } finally {
      setSyncing(false);
    }
  }, [uploadLists, uploadItems, downloadLists, downloadItems]);

  return {
    sync,
    syncing,
    lastSyncAt,
    error,
  };
};
