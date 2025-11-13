import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSupabaseLists } from './useSupabaseLists';
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useSupabaseLists - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('CREATE - createList', () => {
    it('should create a new list successfully', async () => {
      const mockList = {
        id: 'list-1',
        name: 'Test List',
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockList, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const createdList = await result.current.createList('Test List');

      expect(createdList).toEqual({
        id: mockList.id,
        name: mockList.name,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockFrom.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        name: 'Test List',
      });
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createList('Test')).rejects.toThrow(
        'Usuário não autenticado'
      );
    });

    it('should handle Supabase errors when creating list', async () => {
      const mockError = { message: 'Database error', code: '500' };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createList('Test')).rejects.toThrow(
        'Failed to create list: Database error'
      );
    });
  });

  describe('READ - loadLists', () => {
    it('should load user lists successfully', async () => {
      const mockLists = [
        {
          id: 'list-1',
          name: 'Groceries',
          user_id: mockUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'list-2',
          name: 'Hardware',
          user_id: mockUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockLists, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.lists).toHaveLength(2);
      expect(result.current.lists[0].name).toBe('Groceries');
      expect(result.current.lists[1].name).toBe('Hardware');
    });

    it('should return empty array when no lists exist', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.lists).toEqual([]);
    });

    it('should handle errors when loading lists', async () => {
      const mockError = { message: 'Network error', code: '500' };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeTruthy();
      expect(result.current.lists).toEqual([]);
    });
  });

  describe('UPDATE - updateList', () => {
    it('should update list name successfully', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.updateList('list-1', { name: 'Updated Name' });

      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          updated_at: expect.any(String),
        })
      );
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'list-1');
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        result.current.updateList('list-1', { name: 'Updated' })
      ).rejects.toThrow('Usuário não autenticado');
    });

    it('should handle Supabase errors when updating', async () => {
      const mockError = { message: 'Update failed', code: '500' };

      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        result.current.updateList('list-1', { name: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('DELETE - deleteList', () => {
    it('should delete list successfully', async () => {
      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.deleteList('list-1');

      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'list-1');
    });

    it('should delete items before deleting list', async () => {
      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.deleteList('list-1');

      // Should be called twice: once for items, once for list
      expect(supabase.from).toHaveBeenCalledWith('shopping_items');
      expect(supabase.from).toHaveBeenCalledWith('shopping_lists');
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.deleteList('list-1')).rejects.toThrow(
        'Usuário não autenticado'
      );
    });

    it('should handle Supabase errors when deleting', async () => {
      const mockError = { message: 'Delete failed', code: '500' };

      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.deleteList('list-1')).rejects.toThrow();
    });
  });

  describe('getListById', () => {
    it('should fetch own list by ID successfully', async () => {
      const mockList = {
        id: 'list-1',
        name: 'Test List',
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockList, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const list = await result.current.getListById('list-1');

      expect(list).toEqual({
        id: mockList.id,
        name: mockList.name,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return undefined if list not found', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const list = await result.current.getListById('nonexistent');

      expect(list).toBeUndefined();
    });

    it('should return undefined and not throw on error', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found', details: '', hint: null }
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const { result } = renderHook(() => useSupabaseLists(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const list = await result.current.getListById('nonexistent');

      expect(list).toBeUndefined();
    });
  });
});
