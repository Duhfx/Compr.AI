// src/lib/sharing.test.ts
// Testes para as funções de compartilhamento

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateShareCode, validateShareCode, joinSharedList } from './sharing';
import { supabase } from './supabase';
import { db } from './db';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock Dexie
vi.mock('./db', () => ({
  db: {
    shoppingLists: {
      add: vi.fn(),
    },
    shoppingItems: {
      add: vi.fn(),
    },
    sharedLists: {
      add: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          delete: vi.fn(),
        })),
      })),
    },
  },
}));

describe('sharing utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateShareCode', () => {
    it('should generate a 6-character uppercase code', () => {
      const code = generateShareCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should generate different codes on subsequent calls', () => {
      const code1 = generateShareCode();
      const code2 = generateShareCode();
      // Note: There's a tiny chance they could be the same, but very unlikely
      expect(code1).not.toBe(code2);
    });
  });

  describe('validateShareCode', () => {
    it('should return valid for existing non-expired code', async () => {
      const mockData = {
        share_code: 'ABC123',
        list_id: 'list-1',
        permission: 'edit',
        owner_user_id: 'user-1',
        expires_at: null,
        shopping_lists: {
          id: 'list-1',
          name: 'Test List',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await validateShareCode('abc123');

      expect(result.valid).toBe(true);
      expect(result.data?.listName).toBe('Test List');
      expect(result.data?.permission).toBe('edit');
    });

    it('should return invalid for non-existent code', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await validateShareCode('INVALID');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Código inválido');
    });

    it('should return invalid for expired code', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockData = {
        share_code: 'EXPIRED',
        list_id: 'list-1',
        permission: 'edit',
        owner_user_id: 'user-1',
        expires_at: yesterday.toISOString(),
        shopping_lists: {
          id: 'list-1',
          name: 'Test List',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await validateShareCode('EXPIRED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Código expirado');
    });
  });

  describe('joinSharedList', () => {
    it('should successfully join a shared list', async () => {
      const mockValidation = {
        valid: true,
        data: {
          listId: 'list-1',
          listName: 'Test List',
          permission: 'edit' as const,
          ownerDeviceId: 'owner-1',
        },
      };

      const mockList = {
        id: 'list-1',
        name: 'Test List',
        user_id: 'owner-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItems = [
        {
          id: 'item-1',
          list_id: 'list-1',
          name: 'Item 1',
          quantity: 1,
          unit: 'un',
          category: 'Alimentos',
          checked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock validateShareCode
      vi.spyOn(await import('./sharing'), 'validateShareCode').mockResolvedValue(mockValidation);

      // Mock Supabase calls
      const mockFrom = vi.fn();

      // Mock for checking existing member
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock for adding member
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock for fetching list
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockList, error: null }),
      });

      // Mock for fetching items
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await joinSharedList('ABC123', 'user-2');

      expect(result.listId).toBe('list-1');
      expect(result.listName).toBe('Test List');
      expect(result.itemCount).toBe(1);
      expect(db.shoppingLists.add).toHaveBeenCalled();
      expect(db.shoppingItems.add).toHaveBeenCalled();
    });

    it('should throw error for invalid code', async () => {
      const mockValidation = {
        valid: false,
        error: 'Código inválido',
      };

      vi.spyOn(await import('./sharing'), 'validateShareCode').mockResolvedValue(mockValidation);

      await expect(joinSharedList('INVALID', 'user-2')).rejects.toThrow('Código inválido');
    });
  });
});
