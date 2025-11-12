import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { ShoppingList } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const useLocalLists = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // useLiveQuery se inscreve automaticamente em mudanças
  const lists = useLiveQuery(
    () => db.shoppingLists.orderBy('updatedAt').reverse().toArray(),
    []
  );

  useEffect(() => {
    if (lists !== undefined) {
      setLoading(false);
    }
  }, [lists]);

  const createList = async (name: string): Promise<ShoppingList> => {
    try {
      const newList: ShoppingList = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocal: true
      };

      await db.shoppingLists.add(newList);
      return newList;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const updateList = async (id: string, updates: Partial<ShoppingList>): Promise<void> => {
    try {
      await db.shoppingLists.update(id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const deleteList = async (id: string): Promise<void> => {
    try {
      // Primeiro deletar todos os itens da lista
      await db.shoppingItems.where('listId').equals(id).delete();
      // Depois deletar a lista
      await db.shoppingLists.delete(id);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  const getListById = async (id: string): Promise<ShoppingList | undefined> => {
    try {
      return await db.shoppingLists.get(id);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  };

  // Função para forçar re-query (útil após sincronização)
  const refreshLists = async () => {
    // useLiveQuery já reage automaticamente, mas podemos forçar um reload
    setLoading(true);
    try {
      await db.shoppingLists.toArray(); // Força uma query
    } finally {
      setLoading(false);
    }
  };

  return {
    lists: lists || [],
    loading,
    error,
    createList,
    updateList,
    deleteList,
    getListById,
    refreshLists
  };
};
