import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreateListWithAI, useSuggestions } from './useSuggestions';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';

// Mock dependencies
vi.mock('../lib/supabase');
vi.mock('../lib/db');
vi.mock('./useDeviceId', () => ({
  useDeviceId: () => 'test-device-id',
}));

// Mock fetch global
global.fetch = vi.fn();

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: vi.fn(),
}));

// Mock user para AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'teste@comprai.com',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

// Wrapper com AuthProvider mockado
const wrapper = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

describe('useSuggestions - Autocomplete com IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock AuthContext
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } as any },
      error: null,
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { id: 'mock', unsubscribe: vi.fn() } },
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Histórico Local', () => {
    it('deve buscar sugestões do histórico local primeiro', async () => {
      const mockHistoryItems = [
        {
          id: '1',
          deviceId: 'test-device-id',
          itemName: 'Arroz',
          category: 'Alimentos',
          quantity: 1,
          unit: 'kg',
          purchasedAt: new Date(),
          listId: 'list-1',
        },
        {
          id: '2',
          deviceId: 'test-device-id',
          itemName: 'Arroz integral',
          category: 'Alimentos',
          quantity: 2,
          unit: 'kg',
          purchasedAt: new Date(),
          listId: 'list-1',
        },
      ];

      // Mock Dexie query
      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(mockHistoryItems),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      const { result } = renderHook(() => useSuggestions({ minChars: 2, maxSuggestions: 5 }));

      act(() => {
        result.current.getSuggestions('Arr');
      });

      // Avançar debounce (300ms padrão)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.suggestions).toHaveLength(2);
      expect(result.current.suggestions[0].name).toBe('Arroz');
      expect(result.current.suggestions[0].source).toBe('history');
      expect(result.current.suggestions[1].name).toBe('Arroz integral');
    });

    it('não deve buscar se input for menor que minChars', async () => {
      const { result } = renderHook(() => useSuggestions({ minChars: 3 }));

      act(() => {
        result.current.getSuggestions('Ar');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.suggestions).toHaveLength(0);
    });

    it('deve aplicar debounce corretamente', async () => {
      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      const { result } = renderHook(() => useSuggestions({ debounceMs: 500 }));

      act(() => {
        result.current.getSuggestions('Arr');
      });

      // Avançar apenas 200ms (não deve ter executado ainda)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockWhere.startsWithIgnoreCase).not.toHaveBeenCalled();

      // Completar o debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockWhere.startsWithIgnoreCase).toHaveBeenCalledWith('Arr');
      });
    });

    it('deve cancelar timeout anterior ao receber novo input', async () => {
      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      const { result } = renderHook(() => useSuggestions({ debounceMs: 300 }));

      act(() => {
        result.current.getSuggestions('Arr');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Novo input antes do debounce completar
      act(() => {
        result.current.getSuggestions('Arro');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Deve ter sido chamado apenas uma vez (com o último input)
        expect(mockWhere.startsWithIgnoreCase).toHaveBeenCalledTimes(1);
        expect(mockWhere.startsWithIgnoreCase).toHaveBeenCalledWith('Arro');
      });
    });

    it('deve limpar sugestões corretamente', async () => {
      const { result } = renderHook(() => useSuggestions());

      result.current.suggestions = [
        { name: 'Test', category: 'Test', unit: 'un', quantity: 1, source: 'history' },
      ] as any;

      act(() => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions).toHaveLength(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Sugestões de IA', () => {
    it('deve buscar sugestões da IA quando histórico é insuficiente', async () => {
      const mockHistoryItems = [
        {
          id: '1',
          deviceId: 'test-device-id',
          itemName: 'Arroz',
          category: 'Alimentos',
          quantity: 1,
          unit: 'kg',
          purchasedAt: new Date(),
          listId: 'list-1',
        },
      ];

      const mockAIResponse = {
        items: [
          { name: 'Feijão', quantity: 1, unit: 'kg', category: 'Alimentos' },
          { name: 'Macarrão', quantity: 2, unit: 'pacote', category: 'Alimentos' },
        ],
      };

      // Mock histórico (apenas 1 item)
      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(mockHistoryItems),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      // Mock API fetch
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockAIResponse,
      } as Response);

      const { result } = renderHook(() => useSuggestions({ minChars: 2, maxSuggestions: 5 }));

      act(() => {
        result.current.getSuggestions('Arr');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Deve combinar histórico + IA
      expect(result.current.suggestions).toHaveLength(3);
      expect(result.current.suggestions[0].source).toBe('history');
      expect(result.current.suggestions[1].source).toBe('ai');
      expect(result.current.suggestions[2].source).toBe('ai');
    });

    it('deve usar apenas histórico se houver sugestões suficientes', async () => {
      const mockHistoryItems = [
        { id: '1', itemName: 'Arroz', quantity: 1, unit: 'kg', category: 'Alimentos' },
        { id: '2', itemName: 'Arroz integral', quantity: 2, unit: 'kg', category: 'Alimentos' },
        { id: '3', itemName: 'Arroz parboilizado', quantity: 1, unit: 'kg', category: 'Alimentos' },
        { id: '4', itemName: 'Arroz agulhinha', quantity: 1, unit: 'kg', category: 'Alimentos' },
        { id: '5', itemName: 'Arroz preto', quantity: 1, unit: 'kg', category: 'Alimentos' },
      ].map(item => ({
        ...item,
        deviceId: 'test-device-id',
        purchasedAt: new Date(),
        listId: 'list-1',
      }));

      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(mockHistoryItems),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      const { result } = renderHook(() => useSuggestions({ maxSuggestions: 5 }));

      act(() => {
        result.current.getSuggestions('Arr');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Não deve ter chamado a API (histórico suficiente)
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.suggestions).toHaveLength(5);
      expect(result.current.suggestions.every(s => s.source === 'history')).toBe(true);
    });

    it('deve usar apenas histórico se IA falhar', async () => {
      const mockHistoryItems = [
        {
          id: '1',
          deviceId: 'test-device-id',
          itemName: 'Arroz',
          category: 'Alimentos',
          quantity: 1,
          unit: 'kg',
          purchasedAt: new Date(),
          listId: 'list-1',
        },
      ];

      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(mockHistoryItems),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      // Mock API falha
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      const { result } = renderHook(() => useSuggestions({ maxSuggestions: 5 }));

      act(() => {
        result.current.getSuggestions('Arr');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Deve usar apenas histórico (fallback gracioso)
      expect(result.current.suggestions).toHaveLength(1);
      expect(result.current.suggestions[0].source).toBe('history');
      expect(result.current.error).toBeNull(); // Não deve propagar erro da IA
    });

    it('deve enviar parâmetros corretos para a API', async () => {
      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

      const { result } = renderHook(() => useSuggestions({ maxSuggestions: 10 }));

      act(() => {
        result.current.getSuggestions('Banana');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/suggest-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: 'test-device-id',
            prompt: 'Banana',
            maxResults: 10,
          }),
        });
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro do histórico local', async () => {
      const mockError = new Error('Database error');

      const mockWhere = {
        startsWithIgnoreCase: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockRejectedValue(mockError),
          }),
        }),
      };

      vi.mocked(db.purchaseHistory).where = vi.fn().mockReturnValue(mockWhere as any);

      const { result } = renderHook(() => useSuggestions());

      act(() => {
        result.current.getSuggestions('Arr');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.suggestions).toHaveLength(0);
    });
  });
});

describe('useCreateListWithAI - Criação de Listas com IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AuthContext com usuário válido
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
        } as any,
      },
      error: null,
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { id: 'mock', unsubscribe: vi.fn() } },
    } as any);
  });

  describe('Fluxo Completo', () => {
    it('deve criar lista com itens sugeridos pela IA', async () => {
      const mockSuggestionsResponse = {
        items: [
          { name: 'Picanha', quantity: 1.2, unit: 'kg', category: 'Carnes' },
          { name: 'Carvão', quantity: 2, unit: 'kg', category: 'Mercearia' },
          { name: 'Pão de alho', quantity: 1, unit: 'un', category: 'Padaria' },
        ],
      };

      const mockValidationResponse = {
        isValid: true,
        confidence: 85,
        validatedItems: [
          { name: 'Picanha', quantity: 1.2, unit: 'kg', category: 'Carnes', shouldKeep: true },
          { name: 'Carvão', quantity: 2, unit: 'kg', category: 'Mercearia', shouldKeep: true },
          { name: 'Pão de alho', quantity: 1, unit: 'un', category: 'Padaria', shouldKeep: true },
        ],
      };

      const mockCreatedList = {
        id: 'list-123',
        user_id: mockUser.id,
        name: 'churrasco para 4 pessoas',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock API suggest-items
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuggestionsResponse,
        } as Response)
        // Mock API validate-list
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockValidationResponse,
        } as Response);

      // Mock Supabase insert lista
      const mockListFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedList, error: null }),
      };

      // Mock Supabase insert itens
      const mockItemsFrom = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockListFrom as any)
        .mockReturnValueOnce(mockItemsFrom as any);

      const { result } = renderHook(() => useCreateListWithAI(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const listId = await result.current.createListFromPrompt('churrasco para 4 pessoas');

      expect(listId).toBe('list-123');

      // Verificar chamada da API de sugestões
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/suggest-items',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('churrasco para 4 pessoas'),
        })
      );

      // Verificar criação da lista
      expect(mockListFrom.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        name: 'churrasco para 4 pessoas',
      });

      // Verificar criação dos itens
      expect(mockItemsFrom.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            list_id: 'list-123',
            name: 'Picanha',
            quantity: 1.2,
            unit: 'kg',
          }),
        ])
      );
    });

    it('deve lançar erro quando usuário não está autenticado', async () => {
      // Mock sem usuário
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useCreateListWithAI(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createListFromPrompt('teste')
      ).rejects.toThrow('Usuário não autenticado');
    });

    it('deve lançar erro quando IA não retorna sugestões', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

      const { result } = renderHook(() => useCreateListWithAI(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createListFromPrompt('lista vazia')
      ).rejects.toThrow('IA não retornou sugestões');
    });

    it('deve deletar lista se falhar ao criar itens', async () => {
      const mockSuggestionsResponse = {
        items: [{ name: 'Arroz', quantity: 1, unit: 'kg', category: 'Alimentos' }],
      };

      const mockValidationResponse = {
        isValid: true,
        confidence: 90,
        validatedItems: [
          { name: 'Arroz', quantity: 1, unit: 'kg', category: 'Alimentos', shouldKeep: true },
        ],
      };

      const mockCreatedList = {
        id: 'list-to-delete',
        user_id: mockUser.id,
        name: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSuggestionsResponse } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => mockValidationResponse } as Response);

      const mockListFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedList, error: null }),
      };

      const mockItemsError = { message: 'Items insert failed', code: '500' };
      const mockItemsFrom = {
        insert: vi.fn().mockResolvedValue({ data: null, error: mockItemsError }),
      };

      const mockDeleteFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockListFrom as any)
        .mockReturnValueOnce(mockItemsFrom as any)
        .mockReturnValueOnce(mockDeleteFrom as any);

      const { result } = renderHook(() => useCreateListWithAI(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.createListFromPrompt('test')).rejects.toThrow(
        'Failed to create items'
      );

      // Verificar que tentou deletar a lista
      expect(mockDeleteFrom.delete).toHaveBeenCalled();
      expect(mockDeleteFrom.eq).toHaveBeenCalledWith('id', 'list-to-delete');
    });

    it('deve funcionar sem validação se API de validação falhar', async () => {
      const mockSuggestionsResponse = {
        items: [{ name: 'Arroz', quantity: 1, unit: 'kg', category: 'Alimentos' }],
      };

      const mockCreatedList = {
        id: 'list-456',
        user_id: mockUser.id,
        name: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // API de sugestões OK, validação falha
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSuggestionsResponse } as Response)
        .mockResolvedValueOnce({ ok: false, statusText: 'Validation failed' } as Response);

      const mockListFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedList, error: null }),
      };

      const mockItemsFrom = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockListFrom as any)
        .mockReturnValueOnce(mockItemsFrom as any);

      const { result } = renderHook(() => useCreateListWithAI(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const listId = await result.current.createListFromPrompt('test');

      // Deve ter criado a lista mesmo sem validação
      expect(listId).toBe('list-456');
      expect(mockItemsFrom.insert).toHaveBeenCalled();
    });
  });

  describe('Estados de Loading e Error', () => {
    it('deve atualizar loading state corretamente', async () => {
      const mockSuggestionsResponse = {
        items: [{ name: 'Test', quantity: 1, unit: 'un', category: 'Test' }],
      };

      const mockValidationResponse = {
        isValid: true,
        confidence: 90,
        validatedItems: [{ name: 'Test', shouldKeep: true }],
      };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSuggestionsResponse } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => mockValidationResponse } as Response);

      const mockListFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'list', user_id: mockUser.id, name: 'test' },
          error: null,
        }),
      };

      const mockItemsFrom = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockListFrom as any)
        .mockReturnValueOnce(mockItemsFrom as any);

      const { result } = renderHook(() => useCreateListWithAI(), { wrapper });

      expect(result.current.loading).toBe(false);

      const promise = result.current.createListFromPrompt('test');

      // Durante execução, loading deve ser true
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await promise;

      // Após conclusão, loading deve ser false
      expect(result.current.loading).toBe(false);
    });

    it('deve armazenar erro no estado quando falha', async () => {
      const mockError = new Error('API Error');

      vi.mocked(global.fetch).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateListWithAI(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.createListFromPrompt('test')).rejects.toThrow();

      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });
});
