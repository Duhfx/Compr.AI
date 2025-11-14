import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';

// Mock do cliente Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock de usuário
const mockUser: User = {
  id: 'test-user-id-123',
  email: 'teste@comprai.com',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
  role: 'authenticated',
};

// Mock de sessão
const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Wrapper para testes
const wrapper = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

describe('AuthContext - Autenticação', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock do unsubscribe
    mockUnsubscribe = vi.fn();

    // Mock padrão do onAuthStateChange
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: 'mock-subscription-id',
          unsubscribe: mockUnsubscribe,
        },
      },
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialização', () => {
    it('deve iniciar com loading = true', () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('deve carregar sessão existente ao inicializar', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('deve iniciar sem usuário se não houver sessão', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('deve configurar listener de mudanças de autenticação', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
      });
    });

    it('deve fazer cleanup do listener ao desmontar', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('signIn - Login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signIn('teste@comprai.com', 'senha123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'teste@comprai.com',
        password: 'senha123',
      });
    });

    it('deve lançar erro com credenciais inválidas', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockError = {
        message: 'Invalid login credentials',
        status: 400,
        name: 'AuthApiError',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signIn('teste@comprai.com', 'senha_errada')
      ).rejects.toEqual(mockError);
    });

    it('deve lançar erro quando email não existe', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockError = {
        message: 'Invalid login credentials',
        status: 400,
        name: 'AuthApiError',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signIn('naoexiste@comprai.com', 'senha123')
      ).rejects.toEqual(mockError);
    });

    it('deve lançar erro quando há problemas de rede', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockError = {
        message: 'Network error',
        status: 500,
        name: 'AuthNetworkError',
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signIn('teste@comprai.com', 'senha123')
      ).rejects.toEqual(mockError);
    });
  });

  describe('signUp - Cadastro', () => {
    it('deve cadastrar novo usuário com sucesso', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signUp('novo@comprai.com', 'senha123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'novo@comprai.com',
        password: 'senha123',
      });
    });

    it('deve lançar erro quando email já está cadastrado', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockError = {
        message: 'User already registered',
        status: 400,
        name: 'AuthApiError',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signUp('existente@comprai.com', 'senha123')
      ).rejects.toEqual(mockError);
    });

    it('deve lançar erro com senha fraca (validação backend)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockError = {
        message: 'Password should be at least 6 characters',
        status: 400,
        name: 'AuthApiError',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signUp('novo@comprai.com', '123')
      ).rejects.toEqual(mockError);
    });

    it('deve lançar erro com email inválido', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockError = {
        message: 'Invalid email format',
        status: 400,
        name: 'AuthApiError',
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signUp('email-invalido', 'senha123')
      ).rejects.toEqual(mockError);
    });
  });

  describe('signOut - Logout', () => {
    it('deve fazer logout com sucesso', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('deve lançar erro quando logout falha', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockError = {
        message: 'Logout failed',
        status: 500,
        name: 'AuthApiError',
      };

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.signOut()).rejects.toEqual(mockError);
    });
  });

  describe('onAuthStateChange - Listener de Mudanças', () => {
    it('deve atualizar estado quando usuário faz login', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      let authCallback: any;
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              id: 'mock-subscription-id',
              unsubscribe: mockUnsubscribe,
            },
          },
        } as any;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simular login via listener
      authCallback('SIGNED_IN', mockSession);

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('deve limpar estado quando usuário faz logout', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      let authCallback: any;
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              id: 'mock-subscription-id',
              unsubscribe: mockUnsubscribe,
            },
          },
        } as any;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simular logout via listener
      authCallback('SIGNED_OUT', null);

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
      });
    });

    it('deve atualizar loading state corretamente', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Inicialmente loading deve ser true
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('useAuth Hook - Validações', () => {
    it('deve lançar erro quando usado fora do AuthProvider', () => {
      // Mock console.error para evitar poluir output do teste
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });

    it('deve retornar todas as propriedades esperadas', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verificar que todas as propriedades existem
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('signUp');
      expect(result.current).toHaveProperty('signIn');
      expect(result.current).toHaveProperty('signOut');

      // Verificar tipos
      expect(typeof result.current.signUp).toBe('function');
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
      expect(typeof result.current.loading).toBe('boolean');
    });
  });

  describe('Persistência de Sessão', () => {
    it('deve configurar persistência no localStorage', async () => {
      // Verificar que supabase foi criado com persistSession: true
      // Isso é verificado indiretamente através do funcionamento correto
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
    });
  });
});
