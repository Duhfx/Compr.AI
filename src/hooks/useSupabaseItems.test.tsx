import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSupabaseItems } from './useSupabaseItems';
import { supabase } from '../lib/supabase';
import { AuthProvider } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

// Mock auth context
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

const wrapper = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

const TEST_LIST_ID = 'test-list-id';

describe('useSupabaseItems - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('CREATE - createItem', () => {
    it('should create a new item successfully', async () => {
      const mockItem = {
        id: 'item-1',
        list_id: TEST_LIST_ID,
        name: 'Milk',
        quantity: 2,
        unit: 'L',
        category: 'Dairy',
        checked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockItem, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const createdItem = await result.current.createItem('Milk', 2, 'L', 'Dairy');

      expect(createdItem).toEqual({
        id: mockItem.id,
        listId: TEST_LIST_ID,
        name: 'Milk',
        quantity: 2,
        unit: 'L',
        category: 'Dairy',
        checked: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockFrom.insert).toHaveBeenCalledWith({
        list_id: TEST_LIST_ID,
        name: 'Milk',
        quantity: 2,
        unit: 'L',
        category: 'Dairy',
      });
    });

    it('should create item with default values', async () => {
      const mockItem = {
        id: 'item-1',
        list_id: TEST_LIST_ID,
        name: 'Bread',
        quantity: 1,
        unit: 'un',
        category: null,
        checked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockItem, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const createdItem = await result.current.createItem('Bread');

      expect(createdItem.quantity).toBe(1);
      expect(createdItem.unit).toBe('un');
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createItem('Test')).rejects.toThrow(
        'Usuário não autenticado'
      );
    });
  });

  describe('READ - loadItems', () => {
    it('should load items successfully', async () => {
      const mockItems = [
        {
          id: 'item-1',
          list_id: TEST_LIST_ID,
          name: 'Milk',
          quantity: 2,
          unit: 'L',
          category: 'Dairy',
          checked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-2',
          list_id: TEST_LIST_ID,
          name: 'Bread',
          quantity: 1,
          unit: 'un',
          category: 'Bakery',
          checked: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].name).toBe('Milk');
      expect(result.current.items[1].name).toBe('Bread');
    });

    it('should calculate stats correctly', async () => {
      const mockItems = [
        {
          id: 'item-1',
          list_id: TEST_LIST_ID,
          name: 'Milk',
          quantity: 2,
          unit: 'L',
          category: null,
          checked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-2',
          list_id: TEST_LIST_ID,
          name: 'Bread',
          quantity: 1,
          unit: 'un',
          category: null,
          checked: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-3',
          list_id: TEST_LIST_ID,
          name: 'Eggs',
          quantity: 1,
          unit: 'un',
          category: null,
          checked: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.stats.total).toBe(3);
      expect(result.current.stats.checked).toBe(2);
      expect(result.current.stats.unchecked).toBe(1);
    });

    it('should return empty array when no items exist', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.items).toEqual([]);
      expect(result.current.stats.total).toBe(0);
    });
  });

  describe('UPDATE - updateItem', () => {
    it('should update item successfully', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.updateItem('item-1', {
        name: 'Updated Name',
        quantity: 3,
      });

      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          quantity: 3,
          updated_at: expect.any(String),
        })
      );
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'item-1');
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        result.current.updateItem('item-1', { name: 'Updated' })
      ).rejects.toThrow('Usuário não autenticado');
    });
  });

  describe('TOGGLE - toggleItem', () => {
    it('should toggle item checked state', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.toggleItem('item-1', true);

      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          checked: true,
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.toggleItem('item-1', true)).rejects.toThrow(
        'Usuário não autenticado'
      );
    });
  });

  describe('DELETE - deleteItem', () => {
    it('should delete item successfully', async () => {
      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.deleteItem('item-1');

      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'item-1');
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.deleteItem('item-1')).rejects.toThrow(
        'Usuário não autenticado'
      );
    });

    it('should handle Supabase errors when deleting', async () => {
      const mockError = { message: 'Delete failed', code: '500' };

      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseItems(TEST_LIST_ID), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.deleteItem('item-1')).rejects.toThrow();
    });
  });
});
