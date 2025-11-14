import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './suggest-items';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class GoogleGenerativeAI {
    constructor() {}
    getGenerativeModel() {
      return {
        generateContent: vi.fn(),
      };
    }
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn(),
  }),
}));

describe('API /api/suggest-items', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let statusCode: number;
  let responseData: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    // Mock request
    mockReq = {
      method: 'POST',
      body: {},
    };

    // Mock response
    statusCode = 200;
    responseData = null;

    mockRes = {
      status: vi.fn().mockImplementation((code: number) => {
        statusCode = code;
        return mockRes;
      }),
      json: vi.fn().mockImplementation((data: any) => {
        responseData = data;
        return mockRes;
      }),
    };
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  describe('Validação de Método HTTP', () => {
    it('deve retornar 405 para método GET', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(405);
      expect(responseData).toEqual({ error: 'Method not allowed' });
    });

    it('deve retornar 405 para método PUT', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(405);
      expect(responseData).toEqual({ error: 'Method not allowed' });
    });

    it('deve aceitar método POST', async () => {
      mockReq.method = 'POST';
      mockReq.body = {
        userId: 'user-123',
        prompt: 'teste',
      };

      // Mock Supabase e Gemini para passar
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({ items: [] }),
          },
        }),
      };
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => mockModel,
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
    });
  });

  describe('Validação de Variáveis de Ambiente', () => {
    it('deve retornar 500 se SUPABASE_URL estiver faltando', async () => {
      delete process.env.SUPABASE_URL;

      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Server configuration error');
      expect(responseData.message).toContain('environment variables');
    });

    it('deve retornar 500 se SUPABASE_SERVICE_KEY estiver faltando', async () => {
      delete process.env.SUPABASE_SERVICE_KEY;

      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Server configuration error');
    });

    it('deve retornar 500 se GEMINI_API_KEY estiver faltando', async () => {
      delete process.env.GEMINI_API_KEY;

      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Server configuration error');
    });
  });

  describe('Validação de Parâmetros de Entrada', () => {
    it('deve retornar 400 se userId estiver faltando', async () => {
      mockReq.body = { prompt: 'teste' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(400);
      expect(responseData).toEqual({ error: 'userId is required' });
    });

    it('deve aceitar requisição sem prompt (opcional)', async () => {
      mockReq.body = { userId: 'user-123' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({ items: [] }),
          },
        }),
      };
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => mockModel,
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
    });

    it('deve usar maxResults padrão de 10', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () =>
              JSON.stringify({
                items: Array(15)
                  .fill(null)
                  .map((_, i) => ({
                    name: `Item ${i}`,
                    quantity: 1,
                    unit: 'un',
                  })),
              }),
          },
        }),
      };
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => mockModel,
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
      // Deve limitar a 10 itens (padrão)
      expect(responseData.items).toHaveLength(10);
    });
  });

  describe('Integração com Supabase (Histórico)', () => {
    it('deve buscar histórico do usuário', async () => {
      const mockHistory = [
        { item_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg' },
        { item_name: 'Feijão', category: 'Alimentos', quantity: 1, unit: 'kg' },
      ];

      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({ items: [] }),
          },
        }),
      };
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => mockModel,
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Verificar que buscou do purchase_history
      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_history');
    });

    it('deve filtrar itens de listas deletadas (list_id IS NOT NULL)', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockNot = vi.fn().mockReturnThis();
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: mockNot,
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({ items: [] }),
          },
        }),
      };
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => mockModel,
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Verificar que filtrou itens deletados
      expect(mockNot).toHaveBeenCalledWith('list_id', 'is', null);
    });
  });

  describe('Integração com Gemini AI', () => {
    it('deve chamar Gemini com modelo correto (gemini-2.5-flash-lite)', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'churrasco para 2 pessoas' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGetModel = vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () =>
              JSON.stringify({
                items: [
                  { name: 'Picanha', quantity: 0.4, unit: 'kg', category: 'Carnes' },
                ],
              }),
          },
        }),
      });

      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: mockGetModel,
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetModel).toHaveBeenCalledWith({ model: 'gemini-2.5-flash-lite' });
    });

    it('deve incluir histórico do usuário no prompt para IA', async () => {
      const mockHistory = [
        { item_name: 'Arroz', category: 'Alimentos', quantity: 1, unit: 'kg' },
        { item_name: 'Feijão', category: 'Alimentos', quantity: 1, unit: 'kg' },
      ];

      mockReq.body = { userId: 'user-123', prompt: 'lista para jantar' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ items: [] }),
        },
      });

      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Verificar que o prompt inclui o histórico
      const promptArg = mockGenerateContent.mock.calls[0][0];
      expect(promptArg).toContain('Arroz');
      expect(promptArg).toContain('Feijão');
    });

    it('deve parsear corretamente JSON da resposta da IA', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const mockItems = [
        { name: 'Arroz', quantity: 1, unit: 'kg', category: 'Alimentos' },
        { name: 'Feijão', quantity: 1, unit: 'kg', category: 'Alimentos' },
      ];

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => ({
              generateContent: vi.fn().mockResolvedValue({
                response: {
                  text: () => JSON.stringify({ items: mockItems }),
                },
              }),
            }),
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
      expect(responseData.items).toEqual(mockItems);
    });

    it('deve remover markdown da resposta da IA', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => ({
              generateContent: vi.fn().mockResolvedValue({
                response: {
                  // Resposta com markdown
                  text: () =>
                    '```json\n{"items":[{"name":"Arroz","quantity":1,"unit":"kg"}]}\n```',
                },
              }),
            }),
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
      expect(responseData.items).toHaveLength(1);
      expect(responseData.items[0].name).toBe('Arroz');
    });

    it('deve retornar 500 se IA retornar JSON inválido', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => ({
              generateContent: vi.fn().mockResolvedValue({
                response: {
                  text: () => 'JSON inválido sem estrutura',
                },
              }),
            }),
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.message).toContain('Invalid AI response format');
    });
  });

  describe('Validação de Resposta', () => {
    it('deve validar estrutura da resposta (items array)', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => ({
              generateContent: vi.fn().mockResolvedValue({
                response: {
                  // Resposta sem array 'items'
                  text: () => JSON.stringify({ data: [] }),
                },
              }),
            }),
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.message).toContain('Invalid response structure');
    });

    it('deve limitar número de resultados ao maxResults especificado', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste', maxResults: 3 };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => ({
              generateContent: vi.fn().mockResolvedValue({
                response: {
                  text: () =>
                    JSON.stringify({
                      items: Array(10)
                        .fill(null)
                        .map((_, i) => ({ name: `Item ${i}`, quantity: 1, unit: 'un' })),
                    }),
                },
              }),
            }),
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
      expect(responseData.items).toHaveLength(3);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve retornar 500 quando Supabase falha', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('deve retornar 500 quando Gemini AI lança exceção', async () => {
      mockReq.body = { userId: 'user-123', prompt: 'teste' };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      vi.mocked(GoogleGenerativeAI).mockImplementation(
        () =>
          ({
            getGenerativeModel: () => ({
              generateContent: vi.fn().mockRejectedValue(new Error('Gemini API Error')),
            }),
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.message).toContain('Gemini API Error');
    });
  });
});
