# 🔐 Autenticação

## Visão Geral

Sistema de autenticação do Compr.AI usando Supabase Auth, removendo a dependência de autenticação anônima e device IDs.

---

## Migração para Auth Obrigatória (v1.7.0)

**Data de Implementação:** 13/11/2025
**Status:** ✅ Implementado

### Mudanças Principais

#### Antes (v1.0-1.6)
- ✅ Funcionava offline desde o início
- ✅ Auth anônima via `device_id` (UUID gerado localmente)
- ❌ Complexidade alta (sincronização device ↔ user)
- ❌ Dados dispersos (local + nuvem)
- ❌ Difícil gestão de perfil

#### Depois (v1.7+)
- ✅ Auth obrigatória (email + senha)
- ✅ `deviceId` sempre = `user.id` do Supabase
- ✅ Dados centralizados na nuvem
- ✅ Perfil único por usuário
- ❌ Requer login online na primeira vez

### Arquitetura

```
┌──────────────┐
│  Landing (/) │ ──► Não autenticado
└──────┬───────┘
       │
       ├──► /register ──► Cadastro
       └──► /login    ──► Login
                          │
                          ▼
                    ┌─────────────┐
                    │ Supabase    │
                    │ Auth        │
                    └─────┬───────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ AuthContext │ ──► user.id = deviceId
                    └─────┬───────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ /home       │ ──► Protegido
                    │ /list/:id   │
                    │ /history    │
                    └─────────────┘
```

### Implementação

#### 1. AuthContext (`src/contexts/AuthContext.tsx`)

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)

```typescript
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
```

#### 3. Device ID = User ID

```typescript
// Antes (complexo)
const getDeviceId = async () => {
  const stored = localStorage.getItem('deviceId');
  if (stored) return stored;

  const newId = crypto.randomUUID();
  localStorage.setItem('deviceId', newId);

  // Sincronizar com Supabase...
  return newId;
};

// Depois (simples)
const getDeviceId = () => {
  const { user } = useAuth();
  return user?.id || null;
};
```

### Migration SQL

**Arquivo:** `supabase/migrations/006_simplify_auth.sql`

```sql
-- Remove tabela devices (não é mais necessária)
DROP TABLE IF EXISTS devices CASCADE;

-- Adiciona user_id em todas as tabelas
ALTER TABLE shopping_lists ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE purchase_history ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE price_history ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Migra dados existentes de device_id para user_id
-- (Se houver dados antigos)
UPDATE shopping_lists
SET user_id = (
  SELECT id FROM auth.users
  WHERE auth.users.email = shopping_lists.device_id -- Adaptação necessária
);

-- Remove device_id após migração
ALTER TABLE shopping_lists DROP COLUMN device_id;
ALTER TABLE purchase_history DROP COLUMN device_id;
ALTER TABLE price_history DROP COLUMN device_id;

-- Atualiza RLS policies
DROP POLICY IF EXISTS "Users can view own lists" ON shopping_lists;

CREATE POLICY "Users can view own lists"
ON shopping_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists"
ON shopping_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists"
ON shopping_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists"
ON shopping_lists FOR DELETE
USING (auth.uid() = user_id);
```

### Fluxos de Usuário

#### Cadastro (Register)

1. Usuário acessa `/register`
2. Preenche email e senha
3. Submete formulário
4. `supabase.auth.signUp({ email, password })`
5. Supabase cria usuário (tabela `auth.users`)
6. Email de confirmação enviado (opcional)
7. Redirecionado para `/login`
8. Toast: "Conta criada com sucesso!"

**Código:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    toast.error('Senhas não conferem');
    return;
  }

  try {
    setLoading(true);
    await signUp(email, password);
    toast.success('Conta criada! Faça login.');
    navigate('/login');
  } catch (error: any) {
    if (error.message.includes('already registered')) {
      toast.error('Email já cadastrado');
    } else {
      toast.error('Erro ao criar conta');
    }
  } finally {
    setLoading(false);
  }
};
```

#### Login

1. Usuário acessa `/login`
2. Preenche email e senha
3. Submete formulário
4. `supabase.auth.signInWithPassword({ email, password })`
5. Supabase retorna sessão + user
6. `AuthContext` atualiza estado global
7. Redirecionado para `/home`

**Código:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);
    await signIn(email, password);
    toast.success('Login realizado!');
    navigate('/home');
  } catch (error: any) {
    if (error.message.includes('Invalid login credentials')) {
      toast.error('Email ou senha incorretos');
    } else {
      toast.error('Erro ao fazer login');
    }
  } finally {
    setLoading(false);
  }
};
```

#### Logout

1. Usuário clica em "Sair"
2. `supabase.auth.signOut()`
3. `AuthContext` limpa estado
4. Redirecionado para `/login`
5. Dados locais permanecem (IndexedDB)

### Configuração Supabase

#### 1. Environment Variables

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

#### 2. Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);
```

#### 3. Row Level Security (RLS)

```sql
-- Habilita RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own lists"
ON shopping_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists"
ON shopping_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Validações

#### Email

```typescript
const emailSchema = z.string().email('Email inválido');

// Uso
try {
  emailSchema.parse(email);
} catch (error) {
  toast.error('Email inválido');
}
```

#### Senha

```typescript
const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres');

// Confirmação de senha
if (password !== confirmPassword) {
  toast.error('Senhas não conferem');
  return;
}
```

### Tratamento de Erros

#### Erros Comuns

| Erro | Mensagem Supabase | Mensagem ao Usuário |
|------|-------------------|---------------------|
| Email já existe | `User already registered` | "Email já cadastrado" |
| Credenciais inválidas | `Invalid login credentials` | "Email ou senha incorretos" |
| Email inválido | `Invalid email` | "Email inválido" |
| Senha fraca | `Password should be...` | "Senha muito fraca" |

**Código:**
```typescript
catch (error: any) {
  console.error('Auth error:', error);

  if (error.message.includes('already registered')) {
    toast.error('Email já cadastrado');
  } else if (error.message.includes('Invalid login')) {
    toast.error('Email ou senha incorretos');
  } else {
    toast.error('Erro ao autenticar');
  }
}
```

### Segurança

#### 1. Senha Hasheada
- Supabase usa bcrypt automaticamente
- Senhas nunca são armazenadas em texto plano

#### 2. Session Token
- JWT armazenado em `localStorage`
- Auto-refresh de token
- Expira em 1 hora (configurável)

#### 3. RLS Policies
- Cada usuário só acessa seus dados
- Validação no banco de dados
- Impossível burlar via client-side

#### 4. HTTPS
- Todas as requisições são HTTPS
- Não expõe credenciais em transit

### Limitações

#### 1. Sem Uso Offline Inicial
- **Antes:** Podia usar offline desde o início
- **Depois:** Precisa fazer login online uma vez
- **Mitigação:** Service Worker cacheia após primeiro login

#### 2. Dados Anônimos Antigos
- **Antes:** DeviceId persistia entre sessões
- **Depois:** Sem conta = sem acesso
- **Mitigação:** Migração de dados (se necessário)

### Próximos Passos

- [ ] OAuth (Google, Apple)
- [ ] Recuperação de senha
- [ ] Verificação de email obrigatória
- [ ] 2FA (Two-Factor Authentication)
- [ ] Magic Link (login sem senha)

---

**Última atualização:** 14/11/2025
**Versão:** 1.7.0
**Complexidade:** Média (simplificação de lógica existente)
