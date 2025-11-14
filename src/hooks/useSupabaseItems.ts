// src/hooks/useSupabaseItems.ts
// Hook para gerenciar itens usando APENAS Supabase (sem IndexedDB)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type ShoppingItemRow = Database['public']['Tables']['shopping_items']['Row'];
type ShoppingItemInsert = Database['public']['Tables']['shopping_items']['Insert'];

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  checked: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ItemStats {
  total: number;
  checked: number;
  unchecked: number;
}

export const useSupabaseItems = (listId: string) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Calcular estatísticas
  const stats: ItemStats = {
    total: items.length,
    checked: items.filter(item => item.checked).length,
    unchecked: items.filter(item => !item.checked).length,
  };

  // Carregar itens do Supabase
  const loadItems = async () => {
    if (!user || !listId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[useSupabaseItems] Loading items for list:', listId);

      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('list_id', listId)
        .eq('deleted', false) // Only load non-deleted items
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useSupabaseItems] Error loading items:', error);
        throw error;
      }

      console.log('[useSupabaseItems] Loaded items:', data?.length || 0);

      // Converter para formato do frontend
      const formattedItems: ShoppingItem[] = (data || []).map((item: ShoppingItemRow) => ({
        id: item.id,
        listId: item.list_id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || undefined,
        checked: item.checked,
        deleted: item.deleted || false,
        deletedAt: item.deleted_at ? new Date(item.deleted_at) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      setItems(formattedItems);
      setError(null);
    } catch (err) {
      const error = err as Error;
      console.error('[useSupabaseItems] Error loading items:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando o usuário ou listId mudar
  useEffect(() => {
    loadItems();
  }, [user?.id, listId]);

  // Criar novo item
  const createItem = async (
    name: string,
    quantity: number = 1,
    unit: string = 'un',
    category?: string
  ): Promise<ShoppingItem> => {
    if (!user) {
      const error = new Error('Usuário não autenticado. Por favor, faça login.');
      console.error('[useSupabaseItems] User not authenticated:', { user });
      throw error;
    }

    try {
      console.log('[useSupabaseItems] Creating item:', name);

      const newItem: ShoppingItemInsert = {
        list_id: listId,
        name,
        quantity,
        unit,
        category: category || null,
        checked: false,
      };

      const { data, error } = await supabase
        .from('shopping_items')
        .insert(newItem)
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseItems] Error creating item:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        });
        throw new Error(`Failed to create item: ${error.message}`);
      }

      console.log('[useSupabaseItems] Item created:', data);

      const createdItem: ShoppingItem = {
        id: data.id,
        listId: data.list_id,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category || undefined,
        checked: data.checked,
        deleted: data.deleted || false,
        deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // Adicionar à lista local
      setItems([...items, createdItem]);

      return createdItem;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Atualizar item
  const updateItem = async (
    id: string,
    updates: {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      checked?: boolean;
    }
  ): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('[useSupabaseItems] Updating item:', id, updates);

      const { error } = await supabase
        .from('shopping_items')
        .update({
          ...updates,
          category: updates.category || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseItems] Error updating item:', error);
        throw error;
      }

      // Atualizar na lista local
      setItems(items.map(item =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      ));
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Toggle checked status
  const toggleItem = async (id: string): Promise<void> => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    await updateItem(id, { checked: !item.checked });
  };

  // Deletar item (soft delete)
  const deleteItem = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('[useSupabaseItems] Soft deleting item:', id);

      const { error } = await supabase
        .from('shopping_items')
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[useSupabaseItems] Error deleting item:', error);
        throw error;
      }

      // Remover da lista local (pois a query só carrega itens não deletados)
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Restaurar item deletado
  const restoreItem = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('[useSupabaseItems] Restoring item:', id);

      const { data, error } = await supabase
        .from('shopping_items')
        .update({
          deleted: false,
          deleted_at: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useSupabaseItems] Error restoring item:', error);
        throw error;
      }

      // Adicionar de volta à lista local
      const restoredItem: ShoppingItem = {
        id: data.id,
        listId: data.list_id,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category || undefined,
        checked: data.checked,
        deleted: data.deleted || false,
        deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setItems([...items, restoredItem]);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Carregar itens deletados
  const loadDeletedItems = async (): Promise<ShoppingItem[]> => {
    if (!user || !listId) {
      return [];
    }

    try {
      console.log('[useSupabaseItems] Loading deleted items for list:', listId);

      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('list_id', listId)
        .eq('deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('[useSupabaseItems] Error loading deleted items:', error);
        throw error;
      }

      console.log('[useSupabaseItems] Loaded deleted items:', data?.length || 0);

      // Converter para formato do frontend
      const formattedItems: ShoppingItem[] = (data || []).map((item: ShoppingItemRow) => ({
        id: item.id,
        listId: item.list_id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || undefined,
        checked: item.checked,
        deleted: item.deleted || false,
        deletedAt: item.deleted_at ? new Date(item.deleted_at) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      return formattedItems;
    } catch (err) {
      const error = err as Error;
      console.error('[useSupabaseItems] Error loading deleted items:', error);
      throw error;
    }
  };

  return {
    items,
    stats,
    loading,
    error,
    createItem,
    updateItem,
    toggleItem,
    deleteItem,
    restoreItem,
    loadDeletedItems,
    refreshItems: loadItems,
  };
};
