import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './notify-members';

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn(function() {
    return {
      emails: {
        send: vi.fn(),
      },
    };
  }),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('API /api/notify-members', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let statusCode: number;
  let responseData: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
    process.env.RESEND_API_KEY = 'test-resend-key';

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
    delete process.env.RESEND_API_KEY;
  });

  describe('Validação de Método HTTP', () => {
    it('deve retornar 405 para método GET', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(405);
      expect(responseData).toEqual({ error: 'Method not allowed' });
    });

    it('deve retornar 405 para método DELETE', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(405);
      expect(responseData).toEqual({ error: 'Method not allowed' });
    });

    it('deve aceitar método POST', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Test List',
        currentUserId: 'user-123',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { user_id: 'owner' }, error: null }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: { users: [] },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Validação de Parâmetros de Entrada', () => {
    it('deve retornar 400 se listId estiver faltando', async () => {
      mockReq.body = {
        listName: 'Test List',
        currentUserId: 'user-123',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });

    it('deve retornar 400 se listName estiver faltando', async () => {
      mockReq.body = {
        listId: 'list-123',
        currentUserId: 'user-123',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });

    it('deve retornar 400 se currentUserId estiver faltando', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Test List',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });
  });

  describe('Integração com Supabase', () => {
    it('deve buscar owner da lista', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Test List',
        currentUserId: 'user-123',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockFrom = vi.fn();
      const mockSupabase = {
        from: mockFrom.mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { user_id: 'owner-user' },
            error: null,
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: { users: [] },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockFrom).toHaveBeenCalledWith('shopping_lists');
    });

    it('deve buscar membros ativos da lista', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Test List',
        currentUserId: 'user-123',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockFrom = vi.fn();
      const mockSupabase = {
        from: mockFrom
          .mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'owner' },
              error: null,
            }),
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            mockResolvedValue: { data: [], error: null },
          }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: { users: [] },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockFrom).toHaveBeenCalledWith('list_members');
    });

    it('deve buscar emails dos usuários via auth.admin.listUsers', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Test List',
        currentUserId: 'user-123',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockListUsers = vi.fn().mockResolvedValue({
        data: {
          users: [
            { id: 'user-1', email: 'user1@test.com' },
            { id: 'user-2', email: 'user2@test.com' },
          ],
        },
        error: null,
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { user_id: 'owner' }, error: null }),
        }),
        auth: {
          admin: {
            listUsers: mockListUsers,
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockListUsers).toHaveBeenCalled();
    });

    it('deve retornar 500 quando falha ao buscar lista', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Test List',
        currentUserId: 'user-123',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'List not found' },
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn(),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Failed to fetch list');
    });

    it('deve retornar 500 quando falha ao buscar usuários', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Test List',
        currentUserId: 'user-123',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { user_id: 'owner' }, error: null }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: { users: null },
              error: { message: 'Auth error' },
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Failed to fetch users');
    });
  });

  describe('Integração com Resend (Envio de Emails)', () => {
    it('deve enviar emails para todos os membros', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Feira',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'user-2' },
              error: null,
            }),
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            mockResolvedValue: {
              data: [{ user_id: 'user-3' }, { user_id: 'user-4' }],
              error: null,
            },
          }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: {
                users: [
                  { id: 'user-2', email: 'user2@test.com' },
                  { id: 'user-3', email: 'user3@test.com' },
                  { id: 'user-4', email: 'user4@test.com' },
                ],
              },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({ id: 'email-id' });
      vi.mocked(Resend).mockImplementation(
        () =>
          ({
            emails: { send: mockSend },
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Deve ter enviado 3 emails (owner + 2 membros)
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('deve enviar emails com template HTML correto', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Lista de Compras',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { user_id: 'owner' },
            error: null,
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: {
                users: [
                  { id: 'owner', email: 'owner@test.com', user_metadata: { name: 'João' } },
                ],
              },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({ id: 'email-id' });
      vi.mocked(Resend).mockImplementation(
        () =>
          ({
            emails: { send: mockSend },
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Compr.AI <onboarding@resend.dev>',
          to: 'owner@test.com',
          subject: '📝 Lista de Compras foi atualizada',
          html: expect.stringContaining('Lista de Compras'),
        })
      );
    });

    it('deve incluir nome do notificador no email', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Feira',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { user_id: 'owner' },
            error: null,
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: {
                users: [
                  {
                    id: 'user-1',
                    email: 'user1@test.com',
                    user_metadata: { name: 'Maria Silva' },
                  },
                  { id: 'owner', email: 'owner@test.com' },
                ],
              },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({ id: 'email-id' });
      vi.mocked(Resend).mockImplementation(
        () =>
          ({
            emails: { send: mockSend },
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Verificar que o HTML contém o nome do notificador
      const htmlArg = mockSend.mock.calls[0][0].html;
      expect(htmlArg).toContain('Maria Silva');
    });

    it('deve usar fallback para nome quando user_metadata.name não existe', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Feira',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { user_id: 'owner' },
            error: null,
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: {
                users: [
                  { id: 'user-1', email: 'joao.silva@test.com', user_metadata: {} },
                  { id: 'owner', email: 'owner@test.com' },
                ],
              },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({ id: 'email-id' });
      vi.mocked(Resend).mockImplementation(
        () =>
          ({
            emails: { send: mockSend },
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Deve usar parte do email antes do @
      const htmlArg = mockSend.mock.calls[0][0].html;
      expect(htmlArg).toContain('joao.silva');
    });

    it('deve tratar falhas parciais de envio (Promise.allSettled)', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Feira',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { user_id: 'owner' },
            error: null,
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: {
                users: [
                  { id: 'user-1', email: 'user1@test.com' },
                  { id: 'user-2', email: 'user2@test.com' },
                  { id: 'user-3', email: 'user3@test.com' },
                ],
              },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const { Resend } = await import('resend');
      const mockSend = vi
        .fn()
        .mockResolvedValueOnce({ id: 'email-1' })
        .mockRejectedValueOnce(new Error('Email failed'))
        .mockResolvedValueOnce({ id: 'email-3' });

      vi.mocked(Resend).mockImplementation(
        () =>
          ({
            emails: { send: mockSend },
          }) as any
      );

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
      expect(responseData.notifiedCount).toBe(2); // 2 sucesso
      expect(responseData.failedCount).toBe(1); // 1 falha
    });
  });

  describe('Casos Especiais', () => {
    it('deve retornar 200 quando não há membros para notificar', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Feira',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { user_id: null },
            error: null,
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: { users: [] },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
      expect(responseData.message).toBe('No members to notify');
      expect(responseData.notifiedCount).toBe(0);
    });

    it('deve retornar 200 quando não há emails válidos', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Feira',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { user_id: 'owner' },
            error: null,
          }),
        }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: {
                users: [
                  { id: 'user-1', email: null }, // Sem email
                  { id: 'user-2', email: undefined }, // Sem email
                ],
              },
              error: null,
            }),
          },
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(200);
      expect(responseData.message).toBe('No valid emails found');
      expect(responseData.notifiedCount).toBe(0);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve retornar 500 quando ocorre erro genérico', async () => {
      mockReq.body = {
        listId: 'list-123',
        listName: 'Feira',
        currentUserId: 'user-1',
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusCode).toBe(500);
      expect(responseData.error).toBe('Internal server error');
      expect(responseData.message).toContain('Unexpected error');
    });
  });
});
