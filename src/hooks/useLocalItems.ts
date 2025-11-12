import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { ShoppingItem } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const useLocalItems = (listId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // useLiveQuery se inscreve automaticamente em mudanças
  const items = useLiveQuery(
    () => db.shoppingItems
      .where('listId')
      .equals(listId)
      .sortBy('createdAt'),
    [listId]
  );

  useEffect(() => {
    if (items !== undefined) {
      setLoading(false);
    }
  }, [items]);

  const createItem = async (
    name: string,
    quantity: number = 1,
    unit: string = 'un',
    category?: string
  ): Promise<ShoppingItem> => {
    try {
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        listId,
        name,
        quantity,
        unit,
        category,
        checked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.shoppingItems.add(newItem);
      return newItem;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<ShoppingItem>): Promise<void> => {
    try {
      await db.shoppingItems.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const toggleItem = async (id: string): Promise<void> => {
    try {
      const item = await db.shoppingItems.get(id);
      if (item) {
        await db.shoppingItems.update(id, {
          checked: !item.checked,
          updatedAt: new Date()
        });
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      await db.shoppingItems.delete(id);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const getItemById = async (id: string): Promise<ShoppingItem | undefined> => {
    try {
      return await db.shoppingItems.get(id);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const stats = {
    total: items?.length || 0,
    checked: items?.filter(item => item.checked).length || 0,
    unchecked: items?.filter(item => !item.checked).length || 0
  };

  return {
    items: items || [],
    loading,
    error,
    stats,
    createItem,
    updateItem,
    toggleItem,
    deleteItem,
    getItemById
  };
};
