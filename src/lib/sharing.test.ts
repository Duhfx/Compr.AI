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
        used: false,
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
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
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
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await validateShareCode('INVALID');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Código inválido ou não encontrado');
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
        used: false,
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
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await validateShareCode('EXPIRED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Código expirado');
    });

    it('should return invalid for already used code (single-use security)', async () => {
      const mockData = {
        share_code: 'USED123',
        list_id: 'list-1',
        permission: 'edit',
        owner_user_id: 'user-1',
        expires_at: null,
        used: true,
        used_at: new Date().toISOString(),
        used_by_user_id: 'other-user',
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
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await validateShareCode('USED123');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('já foi utilizado');
      expect(result.error).toContain('gerar um novo código');
    });

    it('should normalize code to uppercase before validation', async () => {
      const mockData = {
        share_code: 'ABC123',
        list_id: 'list-1',
        permission: 'edit',
        owner_user_id: 'user-1',
        expires_at: null,
        used: false,
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
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      // Passar código em minúsculas
      await validateShareCode('abc123');

      // Verificar que foi normalizado para uppercase
      expect(mockFrom.eq).toHaveBeenCalledWith('share_code', 'ABC123');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = {
        code: 'PGRST301',
        message: 'Database connection error',
        details: '',
        hint: null,
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await validateShareCode('ABC123');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Erro ao validar código');
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
          ownerUserId: 'owner-1',
        },
      };

      const mockList = {
        id: 'list-1',
        name: 'Test List',
        user_id: 'owner-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

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

      // Mock for marking code as used (single-use)
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock for fetching list
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockList, error: null }),
      });

      // Mock for counting items
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await joinSharedList('ABC123', 'user-2');

      expect(result.listId).toBe('list-1');
      expect(result.listName).toBe('Test List');
      expect(result.itemCount).toBe(5);
    });

    it('should throw error for invalid code', async () => {
      const mockValidation = {
        valid: false,
        error: 'Código inválido',
      };

      vi.spyOn(await import('./sharing'), 'validateShareCode').mockResolvedValue(mockValidation);

      await expect(joinSharedList('INVALID', 'user-2')).rejects.toThrow('Código inválido');
    });

    it('should mark code as used after joining (single-use)', async () => {
      const mockValidation = {
        valid: true,
        data: {
          listId: 'list-1',
          listName: 'Test List',
          permission: 'edit' as const,
          ownerUserId: 'owner-1',
        },
      };

      vi.spyOn(await import('./sharing'), 'validateShareCode').mockResolvedValue(mockValidation);

      const mockUpdateFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockFrom = vi.fn();
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValueOnce(mockUpdateFrom);
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'list-1',
            name: 'Test List',
            user_id: 'owner-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      await joinSharedList('ABC123', 'user-2');

      // Verificar que chamou update para marcar como usado
      expect(mockUpdateFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          used: true,
          used_by_user_id: 'user-2',
        })
      );
      expect(mockUpdateFrom.eq).toHaveBeenCalledWith('share_code', 'ABC123');
    });

    it('should reactivate existing member if already joined', async () => {
      const mockValidation = {
        valid: true,
        data: {
          listId: 'list-1',
          listName: 'Test List',
          permission: 'edit' as const,
          ownerUserId: 'owner-1',
        },
      };

      vi.spyOn(await import('./sharing'), 'validateShareCode').mockResolvedValue(mockValidation);

      const mockUpdateFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockFrom = vi.fn();
      // Mock for checking existing member (found)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'member-1', list_id: 'list-1', user_id: 'user-2', is_active: false },
          error: null,
        }),
      });

      // Mock for reactivating member
      mockFrom.mockReturnValueOnce(mockUpdateFrom);

      // Mock for marking code as used
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock for fetching list
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'list-1',
            name: 'Test List',
            user_id: 'owner-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Mock for counting items
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await joinSharedList('ABC123', 'user-2');

      // Verificar que reativou o membro
      expect(mockUpdateFrom.update).toHaveBeenCalledWith({ is_active: true });
      expect(result.listId).toBe('list-1');
    });

    it('should handle error when adding member fails', async () => {
      const mockValidation = {
        valid: true,
        data: {
          listId: 'list-1',
          listName: 'Test List',
          permission: 'edit' as const,
          ownerUserId: 'owner-1',
        },
      };

      vi.spyOn(await import('./sharing'), 'validateShareCode').mockResolvedValue(mockValidation);

      const mockError = { message: 'Insert failed', code: '500' };

      const mockFrom = vi.fn();
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: mockError }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      await expect(joinSharedList('ABC123', 'user-2')).rejects.toEqual(mockError);
    });

    it('should fetch list via shared_lists if direct fetch fails (RLS)', async () => {
      const mockValidation = {
        valid: true,
        data: {
          listId: 'list-1',
          listName: 'Test List',
          permission: 'edit' as const,
          ownerUserId: 'owner-1',
        },
      };

      vi.spyOn(await import('./sharing'), 'validateShareCode').mockResolvedValue(mockValidation);

      const mockFrom = vi.fn();

      // Mock existing member check
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock add member
      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock mark as used
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock direct fetch (blocked by RLS)
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock fetch via shared_lists
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            share_code: 'ABC123',
            shopping_lists: {
              id: 'list-1',
              name: 'Shared List',
              user_id: 'owner-1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          error: null,
        }),
      });

      // Mock count items
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await joinSharedList('ABC123', 'user-2');

      expect(result.listId).toBe('list-1');
      expect(result.listName).toBe('Shared List');
      expect(result.itemCount).toBe(2);
    });
  });
});
