# 🤖 CLAUDE.md — Guia de Desenvolvimento do Compr.AI

Este documento contém instruções detalhadas para desenvolver o Compr.AI usando Claude Code como assistente de desenvolvimento.
Sempre que possivel, crie testes para validar a funcionalidade implementada.
NÃO precisa criar arquivos .md com passo a passo, a não ser que seja solicitado
Ao implementar uma funcionalidade nova, documentar ela no FUNCIONALIDADES_1311.md
---

## 📋 Visão Geral do Projeto

**Nome:** Compr.AI
**Tipo:** PWA de Lista de Compras Inteligente
**Objetivo:** Permitir criar listas de compras com sincronização em tempo real e sugestões inteligentes via IA

### Stack Principal

- **Frontend:** React 19.2 + Vite 7.2 + TypeScript 5.9 + Tailwind CSS 3.4
- **Backend API:** Vercel Functions (Node.js/TypeScript serverless)
- **Database:** Supabase (PostgreSQL + Realtime)
- **IA:** Google Gemini 2.5 Flash Lite
- **Armazenamento Local:** Dexie.js (IndexedDB v5)
- **PWA:** vite-plugin-pwa + Workbox
- **Notificações:** Web Push + Resend (email)
- **Deploy:** Vercel (frontend + API) + Supabase (database)

---

## 🎯 Abordagem de Desenvolvimento

### Desenvolvimento Incremental por Releases

O projeto está dividido em 5 releases incrementais:

1. **Release 1 — MVP Base** (2-3 semanas)
   - CRUD de listas e itens
   - Armazenamento local (IndexedDB)
   - PWA básico
   - Sincronização manual com Supabase

2. **Release 2 — Compartilhamento** (2-3 semanas)
   - Sistema de códigos de compartilhamento
   - Sincronização em tempo real (Supabase Realtime)
   - Gestão de membros

3. **Release 3 — IA Sugestões** (3-4 semanas)
   - Histórico de compras
   - Sugestões automáticas via Gemini
   - Autocompletar inteligente
   - Interpretação de texto livre

4. **Release 4 — OCR** (3-4 semanas)
   - Captura de notas fiscais
   - OCR (Tesseract.js ou Cloud Vision)
   - Estruturação com Gemini
   - Histórico de preços

5. **Release 5 — Chat e Previsão** (4-5 semanas)
   - Chat contextual com IA
   - Previsão de gastos
   - Dicas de economia
   - Dashboard de estatísticas

### Prioridades

1. **Funcionalidade antes de estética** - Foque em fazer funcionar primeiro
2. **Offline-first** - Tudo deve funcionar localmente antes de sincronizar
3. **Segurança** - Validação de dados, proteção contra XSS/SQL injection
4. **Performance** - Lazy loading, code splitting, otimização de queries
5. **UX Mobile** - Mobile-first design, gestos nativos

---

## 🏗️ Estrutura do Projeto

```
comprai/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icons/                  # Ícones 192x192, 512x512
│   ├── sw-custom.js            # Service Worker customizado
│   └── sw-push.js              # Handler de Push Notifications
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx # HOC para proteger rotas
│   │   ├── layout/
│   │   │   ├── Layout.tsx      # Wrapper com Header + conteúdo + BottomTabBar
│   │   │   ├── Header.tsx
│   │   │   └── BottomTabBar.tsx # Navegação inferior estilo iOS
│   │   ├── lists/
│   │   │   ├── ListCard.tsx    # Card de lista na home
│   │   │   ├── CreateListWithAIModal.tsx
│   │   │   ├── ShareListModal.tsx
│   │   │   ├── JoinListModal.tsx
│   │   │   ├── MembersModal.tsx
│   │   │   ├── MemberAvatars.tsx
│   │   │   └── SharedListBadge.tsx
│   │   ├── items/
│   │   │   ├── ItemRow.tsx     # Linha de item com checkbox
│   │   │   ├── ItemModal.tsx   # Criar/editar item
│   │   │   └── ItemInput.tsx   # Input com autocomplete
│   │   ├── scanner/
│   │   │   ├── ReceiptScanner.tsx
│   │   │   ├── ImageCapture.tsx
│   │   │   ├── OcrProgress.tsx
│   │   │   └── ReceiptPreview.tsx
│   │   ├── suggestions/
│   │   │   └── SuggestionsBanner.tsx # Banner de sugestões com IA
│   │   ├── notifications/
│   │   │   ├── PushNotificationsManager.tsx
│   │   │   └── PushOnboardingModal.tsx
│   │   ├── user/
│   │   │   └── UserProfileModal.tsx
│   │   └── ui/
│   │       ├── ActionSheet.tsx # Action sheet estilo iOS
│   │       └── SegmentedControl.tsx # Controle segmentado iOS
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Contexto de autenticação
│   │   ├── ListsContext.tsx    # Contexto de listas
│   │   └── ThemeContext.tsx    # Contexto de tema
│   ├── pages/
│   │   ├── Landing.tsx         # Landing page (pública)
│   │   ├── Login.tsx           # Login (pública)
│   │   ├── Register.tsx        # Cadastro (pública)
│   │   ├── Home.tsx            # Lista de listas
│   │   ├── ListDetail.tsx      # Detalhe da lista
│   │   ├── JoinList.tsx        # Entrar em lista via código
│   │   ├── History.tsx         # Histórico de compras
│   │   ├── Profile.tsx         # Perfil do usuário
│   │   └── Scanner.tsx         # Scanner de nota fiscal
│   ├── hooks/
│   │   ├── useLocalLists.ts    # CRUD listas locais
│   │   ├── useLocalItems.ts    # CRUD itens locais
│   │   ├── useSupabaseLists.ts # CRUD listas Supabase (com teste)
│   │   ├── useSupabaseItems.ts # CRUD itens Supabase (com teste)
│   │   ├── useListsWithStats.ts # Listas com estatísticas
│   │   ├── useSync.ts          # Sincronização bidirecional
│   │   ├── useRealtimeSync.ts  # Realtime sync (WebSockets)
│   │   ├── useSuggestions.ts   # Sugestões IA (com teste)
│   │   ├── useListSuggestions.ts # Sugestões proativas
│   │   ├── useOCR.ts           # OCR (Tesseract.js)
│   │   ├── useReceiptProcessing.ts # Processar nota fiscal
│   │   ├── useReceiptHistory.ts # Histórico de notas
│   │   ├── usePurchaseHistory.ts # Histórico de compras
│   │   ├── usePushNotifications.ts # Push notifications
│   │   ├── useUserProfile.ts   # CRUD perfil usuário
│   │   ├── useOfflineStatus.ts # Detecta online/offline
│   │   └── usePullToRefresh.tsx # Pull-to-refresh
│   ├── services/
│   │   └── api.ts              # Cliente API (fetch wrapper)
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── db.ts               # Configuração Dexie (v5)
│   │   ├── sharing.ts          # Funções de compartilhamento (com teste)
│   │   ├── imageUtils.ts       # Compressão de imagens
│   │   └── utils.ts            # Utilidades
│   ├── types/
│   │   ├── database.ts         # Types do Supabase
│   │   └── index.ts            # Types gerais
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/                        # Vercel Functions (Backend API)
│   ├── suggest-items.ts        # Sugestões de IA (com teste)
│   ├── normalize-item.ts       # Padronizar nomes
│   ├── process-receipt.ts      # Processar nota fiscal
│   ├── validate-list.ts        # Validar acesso à lista
│   └── notify-members.ts       # Notificar membros (email + push) (com teste)
├── supabase/
│   └── migrations/             # SQL migrations (15 arquivos)
│       ├── 001_initial_schema.sql
│       ├── 002_sharing.sql
│       ├── 003_history.sql
│       ├── 004_price_history.sql
│       ├── 005_remove_devices_table.sql
│       ├── 006_create_user_profiles.sql
│       ├── 006_fix_rls_for_shared_lists.sql
│       ├── 007_fix_infinite_recursion.sql
│       ├── 008_fix_purchase_history_trigger.sql
│       ├── 009_single_use_share_codes.sql
│       ├── 010_ensure_history_tables.sql
│       ├── 011_add_deleted_field.sql
│       ├── 012_add_checked_by_user.sql
│       ├── 013_make_single_use_optional.sql
│       └── 014_add_push_subscriptions.sql
├── tests/                      # Scripts de teste local para API
├── .env.example
├── .env.local                  # Não commitar!
├── vite.config.ts
├── vitest.config.ts            # Configuração de testes
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── ROADMAP_DETALHADO.md        # Roadmap técnico
├── FUNCIONALIDADES_1311.md     # Relatório de funcionalidades
└── README.md
```

---

## 🔧 Setup Inicial

### 1. Criar Projeto Vite

```bash
npm create vite@latest comprai -- --template react-ts
cd comprai
npm install
```

### 2. Instalar Dependências

```bash
# Core
npm install react-router-dom

# Supabase (client para DB e Realtime)
npm install @supabase/supabase-js

# IndexedDB
npm install dexie dexie-react-hooks

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# PWA
npm install -D vite-plugin-pwa workbox-window

# UI Components e Ícones
npm install framer-motion lucide-react react-hot-toast clsx
npm install @use-gesture/react  # Para pull-to-refresh

# Utilities
npm install date-fns uuid zod
npm install -D @types/uuid

# Backend API (Vercel Functions)
npm install @vercel/node @google/generative-ai
npm install web-push resend  # Push notifications e email
npm install -D @types/web-push

# OCR (Release 4)
npm install tesseract.js

# Testes
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 3. Configurar Tailwind CSS

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Configurar PWA

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Compr.AI - Lista de Compras Inteligente',
        short_name: 'Compr.AI',
        description: 'Seu assistente de compras com IA',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 5. Configurar Supabase

**a) Criar projeto em https://supabase.com/dashboard**

**b) Criar arquivo de configuração:**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Persiste sessão no localStorage
    autoRefreshToken: true,     // Atualiza token automaticamente
    detectSessionInUrl: true,   // Para magic links
    storageKey: 'comprai-auth-token'
  }
});
```

**c) Criar arquivo .env.local:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_VAPID_PUBLIC_KEY=sua-vapid-public-key-aqui  # Para push notifications
```

**d) Adicionar ao .gitignore:**

```
.env.local
.env*.local
```

### 6. Configurar Dexie (IndexedDB)

```typescript
// src/lib/db.ts
import Dexie, { Table } from 'dexie';

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  isLocal: boolean;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  checked: boolean;
  checkedByUserId?: string;
  deleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDevice {
  userId: string;  // Mudou de deviceId para userId
  nickname: string;
  lastSyncAt?: Date;
}

export interface PurchaseHistory {
  id: string;
  userId: string;  // Mudou de deviceId para userId
  itemName: string;
  category?: string;
  quantity: number;
  unit: string;
  purchasedAt: Date;
  listId: string;
}

export interface PriceHistory {
  id: string;
  userId: string;  // Mudou de deviceId para userId
  itemName: string;
  price: number;
  store?: string;
  purchasedAt: Date;
  createdAt: Date;
}

export interface SharedList {
  id: string;
  listId: string;
  shareCode: string;
  ownerUserId: string;
  permission: 'edit' | 'readonly';
  createdAt: Date;
  expiresAt?: Date;
  singleUse?: boolean;
  used?: boolean;
}

export interface ListMember {
  id: string;
  listId: string;
  userId: string;
  joinedAt: Date;
  lastSeenAt?: Date;
  isActive: boolean;
}

export interface ListSuggestionCache {
  listId: string;
  suggestions: Array<{
    name: string;
    quantity: number;
    unit: string;
    category?: string;
  }>;
  createdAt: Date;
  itemsCountWhenGenerated: number;
  lastItemNamesHash: string;
}

export class CompraiDB extends Dexie {
  shoppingLists!: Table<ShoppingList, string>;
  shoppingItems!: Table<ShoppingItem, string>;
  userDevice!: Table<UserDevice, string>;
  purchaseHistory!: Table<PurchaseHistory, string>;
  priceHistory!: Table<PriceHistory, string>;
  sharedLists!: Table<SharedList, string>;
  listMembers!: Table<ListMember, string>;
  listSuggestionCache!: Table<ListSuggestionCache, string>;

  constructor() {
    super('CompraiDB');

    // Versão 5 (atual)
    this.version(5).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      userDevice: 'userId',
      purchaseHistory: 'id, userId, itemName, purchasedAt',
      priceHistory: 'id, userId, itemName, purchasedAt',
      sharedLists: 'id, listId, shareCode',
      listMembers: 'id, listId, userId, isActive',
      listSuggestionCache: 'listId, createdAt'
    });
  }
}

export const db = new CompraiDB();
```

### 6. Configurar Vercel Functions (Backend API)

**Criar pasta `api/` na raiz do projeto:**

```bash
mkdir api
```

**Exemplo de Function (`api/suggest-items.ts`):**

```typescript
// api/suggest-items.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId, prompt, listType } = req.body;

    // Cliente Supabase (com service key para acesso admin)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Buscar histórico do usuário
    const { data: history } = await supabase
      .from('purchase_history')
      .select('item_name, category, quantity, unit')
      .eq('device_id', deviceId)
      .order('purchased_at', { ascending: false })
      .limit(50);

    // Chamar Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
Você é assistente de lista de compras.
Histórico do usuário: ${JSON.stringify(history)}

Tarefa: Sugerir itens para "${listType || 'compras gerais'}".
${prompt ? `Contexto: ${prompt}` : ''}

Retorne APENAS JSON válido (sem markdown):
{
  "items": [
    { "name": "Arroz integral", "quantity": 2, "unit": "kg", "category": "Alimentos" }
  ]
}
`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const suggestions = JSON.parse(text);

    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error in suggest-items:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

**Configurar variáveis de ambiente na Vercel:**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Adicionar variáveis de ambiente
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add GEMINI_API_KEY
```

**No frontend, chamar a API:**

```typescript
// src/services/api.ts
export const suggestItems = async (deviceId: string, prompt: string) => {
  const response = await fetch('/api/suggest-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, prompt })
  });

  if (!response.ok) {
    throw new Error('Failed to get suggestions');
  }

  return response.json();
};
```

---

## 📝 Padrões de Código

### TypeScript

- **Sempre tipar** funções, props e variáveis
- Usar `interface` para objetos, `type` para unions/intersections
- Evitar `any`, preferir `unknown` quando necessário

### Componentes React

```typescript
// ✅ BOM
interface ListCardProps {
  list: ShoppingList;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ListCard: React.FC<ListCardProps> = ({ list, onEdit, onDelete }) => {
  return (
    <div className="border rounded-lg p-4">
      {/* ... */}
    </div>
  );
};

// ❌ EVITAR
export const ListCard = (props: any) => {
  // Sem tipos, difícil manter
};
```

### Hooks Personalizados

```typescript
// src/hooks/useLocalLists.ts
export const useLocalLists = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const data = await db.shoppingLists.toArray();
        setLists(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadLists();
  }, []);

  const createList = async (name: string) => {
    const newList: ShoppingList = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocal: true
    };

    await db.shoppingLists.add(newList);
    setLists([...lists, newList]);
    return newList;
  };

  const updateList = async (id: string, updates: Partial<ShoppingList>) => {
    await db.shoppingLists.update(id, {
      ...updates,
      updatedAt: new Date()
    });

    setLists(lists.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteList = async (id: string) => {
    await db.shoppingLists.delete(id);
    setLists(lists.filter(l => l.id !== id));
  };

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList
  };
};
```

### Tratamento de Erros

```typescript
// ✅ BOM - Específico e informativo
try {
  await supabase.from('shopping_lists').insert(data);
} catch (error) {
  if (error instanceof Error) {
    console.error('Erro ao salvar lista:', error.message);
    toast.error(`Não foi possível salvar: ${error.message}`);
  }
}

// ❌ EVITAR - Genérico
try {
  await supabase.from('shopping_lists').insert(data);
} catch (error) {
  console.log('erro');
}
```

---

## 🗄️ Esquema do Banco de Dados

**Observação:** O projeto migrou de autenticação anônima (tabela `devices`) para autenticação real com Supabase Auth (tabela `user_profiles`). As migrations 001-004 foram mantidas para referência histórica, mas o schema atual usa `user_id` ao invés de `device_id`.

### Migration 1: Schema Inicial (Release 1)

```sql
-- supabase/migrations/001_initial_schema.sql

-- NOTA: Tabela devices foi REMOVIDA na migration 005
-- Agora usamos Supabase Auth (auth.users)

-- Tabela de listas de compras
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Mudou de device_id
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'un',
  category TEXT,
  checked BOOLEAN DEFAULT FALSE,
  checked_by_user_id UUID REFERENCES auth.users(id),  -- Migration 012
  deleted BOOLEAN DEFAULT FALSE,  -- Migration 011
  deleted_at TIMESTAMPTZ,         -- Migration 011
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_items_list ON shopping_items(list_id);
CREATE INDEX idx_items_checked ON shopping_items(list_id, checked);
CREATE INDEX idx_items_deleted ON shopping_items(deleted);

-- RLS (Row Level Security)
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso baseado em user_id ou membership)
CREATE POLICY "Usuários podem acessar suas próprias listas"
  ON shopping_lists FOR ALL
  USING (user_id = auth.uid() OR id IN (
    SELECT list_id FROM list_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Membros podem acessar itens de listas compartilhadas"
  ON shopping_items FOR ALL
  USING (list_id IN (
    SELECT id FROM shopping_lists
    WHERE user_id = auth.uid()
    OR id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid())
  ));
```

### Migration 2: Compartilhamento (Release 2)

```sql
-- supabase/migrations/002_sharing.sql

-- Tabela de listas compartilhadas
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),  -- Mudou de owner_device_id
  permission TEXT DEFAULT 'edit' CHECK (permission IN ('edit', 'readonly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  single_use BOOLEAN DEFAULT FALSE,  -- Migration 009
  used BOOLEAN DEFAULT FALSE,        -- Migration 009
  used_at TIMESTAMPTZ,               -- Migration 009
  used_by_user_id UUID REFERENCES auth.users(id)  -- Migration 009
);

-- Tabela de membros
CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),  -- Mudou de device_id
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(list_id, user_id)
);

CREATE INDEX idx_share_code ON shared_lists(share_code);
CREATE INDEX idx_members_list ON list_members(list_id);
CREATE INDEX idx_members_user ON list_members(user_id);

-- RLS
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- View helper (Migration 006)
CREATE VIEW list_members_with_names AS
SELECT
  lm.id,
  lm.list_id,
  lm.user_id,
  lm.joined_at,
  lm.last_seen_at,
  lm.is_active,
  up.nickname,
  up.avatar_url
FROM list_members lm
LEFT JOIN user_profiles up ON lm.user_id = up.user_id;
```

### Migration 3: Histórico (Release 3)

```sql
-- supabase/migrations/003_history.sql

-- Histórico de compras
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Mudou de device_id
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  unit TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL
);

CREATE INDEX idx_history_user ON purchase_history(user_id, purchased_at DESC);
CREATE INDEX idx_history_item ON purchase_history(item_name);

-- Trigger para registrar compras automaticamente
-- NOTA: Corrigido nas migrations 007 e 008 para evitar recursão infinita
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas registra se item foi marcado como checked (transição de FALSE para TRUE)
  IF NEW.checked = TRUE AND (OLD.checked IS NULL OR OLD.checked = FALSE) THEN
    INSERT INTO purchase_history (user_id, item_name, category, quantity, unit, list_id)
    SELECT sl.user_id, NEW.name, NEW.category, NEW.quantity, NEW.unit, NEW.list_id
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_purchase
AFTER UPDATE ON shopping_items
FOR EACH ROW
EXECUTE FUNCTION log_purchase();

-- RLS
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem acessar seu próprio histórico"
  ON purchase_history FOR ALL
  USING (user_id = auth.uid());
```

### Migration 4: Preços (Release 4)

```sql
-- supabase/migrations/004_price_history.sql

-- Histórico de preços
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Mudou de device_id
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  store TEXT,
  purchased_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_item ON price_history(item_name, purchased_at DESC);
CREATE INDEX idx_price_user ON price_history(user_id);

-- RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem acessar seu histórico de preços"
  ON price_history FOR ALL
  USING (user_id = auth.uid());
```

### Migration 5: Remoção da Tabela Devices (Crítica)

```sql
-- supabase/migrations/005_remove_devices_table.sql

-- Migra de auth anônima (devices) para auth real (users)
-- Esta migration remove a tabela devices e atualiza todas as referências

-- 1. Remove foreign keys
ALTER TABLE shopping_lists DROP CONSTRAINT IF EXISTS shopping_lists_device_id_fkey;
ALTER TABLE purchase_history DROP CONSTRAINT IF EXISTS purchase_history_device_id_fkey;
ALTER TABLE price_history DROP CONSTRAINT IF EXISTS price_history_device_id_fkey;

-- 2. Renomeia colunas device_id para user_id
ALTER TABLE shopping_lists RENAME COLUMN device_id TO user_id;
ALTER TABLE purchase_history RENAME COLUMN device_id TO user_id;
ALTER TABLE price_history RENAME COLUMN device_id TO user_id;

-- 3. Adiciona foreign keys para auth.users
ALTER TABLE shopping_lists ADD CONSTRAINT shopping_lists_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE purchase_history ADD CONSTRAINT purchase_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE price_history ADD CONSTRAINT price_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Remove tabela devices
DROP TABLE IF EXISTS devices CASCADE;
```

### Migration 6: Perfis de Usuário e View Helper

```sql
-- supabase/migrations/006_create_user_profiles.sql

-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  push_subscription JSONB  -- Migration 014: Para push notifications
);

CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX idx_push_subscription ON user_profiles USING GIN (push_subscription);

-- Trigger para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', 'Usuário'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- View helper para membros com nomes
CREATE VIEW list_members_with_names AS
SELECT
  lm.id,
  lm.list_id,
  lm.user_id,
  lm.joined_at,
  lm.last_seen_at,
  lm.is_active,
  up.nickname,
  up.avatar_url
FROM list_members lm
LEFT JOIN user_profiles up ON lm.user_id = up.user_id;

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver perfis públicos"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());
```

### Migrations Adicionais (007-014)

**007-008:** Correção de recursão infinita no trigger `log_purchase()`
**009:** Códigos de compartilhamento de uso único (`single_use`, `used`, `used_at`)
**010:** Garantia de existência das tabelas de histórico
**011:** Soft delete em itens (`deleted`, `deleted_at`)
**012:** Rastreamento de quem marcou item (`checked_by_user_id`)
**013:** Torna `single_use` opcional (default FALSE)
**014:** Adiciona `push_subscription` (JSONB) em `user_profiles`

Para ver o SQL completo, consulte `/supabase/migrations/` no repositório.
```

---

## 🔐 Segurança

### Validação de Dados

```typescript
// lib/validation.ts
import { z } from 'zod';

export const listSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100, 'Nome muito longo')
});

export const itemSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(200),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unit: z.enum(['un', 'kg', 'g', 'L', 'ml']),
  category: z.string().optional()
});

// Uso:
const createList = async (name: string) => {
  const validated = listSchema.parse({ name }); // Throws se inválido
  // ... resto
};
```

### Sanitização de Inputs

```typescript
// ✅ BOM - Sanitizar antes de salvar
const sanitizeInput = (input: string) => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove tags HTML básicas
    .substring(0, 200); // Limita tamanho
};

const createItem = async (name: string) => {
  const sanitized = sanitizeInput(name);
  // ... salvar
};
```

### Proteção Contra SQL Injection

```typescript
// ✅ BOM - Usar query builders do Supabase (já protegido)
const items = await supabase
  .from('shopping_items')
  .select('*')
  .eq('list_id', listId); // Parâmetros são escapados automaticamente

// ❌ EVITAR - Concatenação de strings (vulnerável)
const query = `SELECT * FROM shopping_items WHERE list_id = '${listId}'`;
```

---

## 🧪 Testes

### Framework Configurado

**Framework:** Vitest 4.0.8 + React Testing Library 16.3.0 + jsdom 27.2.0

**Scripts disponíveis:**
```bash
npm test              # Roda testes em modo watch
npm run test:ui       # Interface visual de testes (Vitest UI)
npm run test:coverage # Relatório de cobertura
```

### Estrutura de Testes

```
src/
├── contexts/
│   └── AuthContext.test.tsx      ✅ Testado
├── hooks/
│   ├── useSupabaseLists.test.tsx ✅ Testado
│   ├── useSupabaseItems.test.tsx ✅ Testado
│   └── useSuggestions.test.tsx   ✅ Testado
├── lib/
│   └── sharing.test.ts           ✅ Testado
api/
├── suggest-items.test.ts         ✅ Testado
└── notify-members.test.ts        ✅ Testado
```

**Cobertura atual:** ~15% (9 arquivos testados de 61 total)

### Exemplo de Teste

```typescript
// src/hooks/useSupabaseLists.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSupabaseLists } from './useSupabaseLists';
import { useAuth } from '../contexts/AuthContext';

// Mock do AuthContext
vi.mock('../contexts/AuthContext');

describe('useSupabaseLists', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      isAuthenticated: true,
    });
  });

  it('deve criar uma nova lista', async () => {
    const { result } = renderHook(() => useSupabaseLists());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const list = await result.current.createList('Feira');
    expect(list.name).toBe('Feira');
    expect(result.current.lists).toContainEqual(expect.objectContaining({ name: 'Feira' }));
  });
});
```

### Configuração Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 🚀 Deploy

### Vercel (Frontend + API Functions)

**1. Instalar Vercel CLI:**

```bash
npm i -g vercel
```

**2. Fazer login:**

```bash
vercel login
```

**3. Deploy de desenvolvimento:**

```bash
# Na raiz do projeto
vercel
```

Isso faz deploy tanto do frontend quanto das Vercel Functions na pasta `/api`.

**4. Configurar variáveis de ambiente:**

```bash
# Variáveis do frontend (prefixo VITE_)
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_VAPID_PUBLIC_KEY

# Variáveis das Vercel Functions (sem prefixo)
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add GEMINI_API_KEY
vercel env add RESEND_API_KEY
vercel env add VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
```

**5. Deploy de produção:**

```bash
vercel --prod
```

**6. Deploy automático (recomendado):**

1. Conecte o repositório Git no dashboard da Vercel
2. Cada push para `main` faz deploy automático
3. Pull requests ganham preview deployments

### Supabase (Database + Realtime)

**1. Criar migrations localmente:**

```bash
# Instalar CLI
npm i -g supabase

# Inicializar projeto
supabase init

# Criar migration
supabase migration new initial_schema
```

**2. Aplicar migrations no projeto:**

```bash
# Login
supabase login

# Link com projeto
supabase link --project-ref seu-projeto-ref

# Aplicar migrations
supabase db push
```

**Nota:** Não usamos Supabase Edge Functions, apenas PostgreSQL e Realtime.

---

## 📚 Recursos e Documentação

### Documentação Oficial

- **React:** https://react.dev
- **Vite:** https://vitejs.dev
- **Supabase:** https://supabase.com/docs
- **Dexie.js:** https://dexie.org
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Gemini AI:** https://ai.google.dev/docs

### Tutoriais Úteis

- **PWA com Vite:** https://vite-pwa-org.netlify.app
- **Realtime com Supabase:** https://supabase.com/docs/guides/realtime
- **Vercel Functions:** https://vercel.com/docs/functions
- **Gemini AI SDK:** https://ai.google.dev/gemini-api/docs/get-started/node

---

## 🐛 Debugging

### DevTools Essenciais

1. **React DevTools** - Inspecionar componentes
2. **IndexedDB Inspector** - Ver dados locais (Chrome DevTools > Application > IndexedDB)
3. **Network Tab** - Monitorar requisições Supabase
4. **Console** - Logs estruturados

### Logs Estruturados

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Futuramente: enviar para Sentry
  },
  sync: (message: string, data?: any) => {
    console.log(`[SYNC] ${message}`, data);
  }
};

// Uso:
logger.sync('Sincronizando lista', { listId });
```

---

## ✅ Checklist de Qualidade

### Antes de Cada Release

- [ ] Código está tipado (sem `any`)
- [ ] Não há warnings no console
- [ ] PWA funciona offline
- [ ] Sincronização funciona online/offline
- [ ] UI é responsiva (testado mobile + desktop)
- [ ] Performance é aceitável (< 3s load time)
- [ ] Dados sensíveis não estão expostos
- [ ] `.env.local` está no `.gitignore`
- [ ] README.md está atualizado
- [ ] Commits seguem padrão (Conventional Commits)

### Padrão de Commits

```
feat: adiciona compartilhamento de listas
fix: corrige sincronização offline
docs: atualiza README com instruções de deploy
refactor: melhora estrutura de hooks
style: formata código com Prettier
```

---

## 🎨 Design System (Sugestões)

### Cores Principais

```css
/* tailwind.config.js - extend theme */
colors: {
  primary: {
    50: '#EEF2FF',
    500: '#6366F1', /* Indigo */
    700: '#4338CA',
  },
  success: '#10B981', /* Green */
  warning: '#F59E0B', /* Amber */
  error: '#EF4444', /* Red */
}
```

### Componentes UI (shadcn/ui)

Recomendo usar shadcn/ui para acelerar desenvolvimento:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add checkbox
```

Documentação: https://ui.shadcn.com

---

## 🤖 Prompts para Claude Code

### Para Iniciar Release

```
Vamos implementar a Release 1 do Compr.AI.
Consulte o arquivo ROADMAP_DETALHADO.md e CLAUDE.md para contexto.

Por favor:
1. Crie a estrutura básica do projeto
2. Configure Dexie.js com as interfaces necessárias
3. Crie os componentes ListCard e ItemRow
4. Implemente os hooks useLocalLists e useLocalItems

Siga os padrões de código definidos no CLAUDE.md.
```

### Para Debugging

```
Estou tendo problema com [descrever problema].
Logs: [colar logs]
Código relevante: [colar código]

Pode me ajudar a debugar? Consulte CLAUDE.md para padrões do projeto.
```

### Para Revisão de Código

```
Revise o código em [arquivo] seguindo os padrões do CLAUDE.md.
Verifique:
- Tipagem TypeScript
- Segurança (XSS, SQL injection)
- Performance
- Boas práticas React
```

---

## 📞 Suporte

### Problemas Comuns

**1. Supabase não conecta:**
- Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- Confirme que RLS está configurado corretamente

**2. IndexedDB não persiste:**
- Verifique se está em modo privado (não funciona)
- Limpe cache do navegador e teste novamente

**3. PWA não instala:**
- Verifique manifest.json e ícones
- Certifique-se que está em HTTPS (ou localhost)

**4. Gemini API retorna erro:**
- Confirme que a API key está correta
- Verifique rate limits (15 req/min para Flash)

---

**Este documento é um guia vivo e deve ser atualizado conforme o projeto evolui.**

**Última atualização:** 2025-11-18
**Versão:** 1.1.0

## 📊 Estado Atual do Projeto

**Releases Implementadas:**
- ✅ Release 1 — MVP Base (CRUD, IndexedDB, PWA, Supabase)
- ✅ Release 2 — Compartilhamento (códigos, realtime sync, membros)
- ✅ Release 3 — IA Sugestões (Gemini, histórico, autocomplete)
- ⚠️ Release 4 — OCR (Tesseract.js implementado, integração parcial)
- ❌ Release 5 — Chat e Previsão (planejado)

**Componentes:** 23 arquivos
**Hooks:** 21 arquivos (5 com testes)
**Páginas:** 9 arquivos
**Contexts:** 3 arquivos (1 com teste)
**API Functions:** 6 arquivos (2 com testes)
**Migrations:** 15 arquivos

**Features Destacadas:**
- 🔐 Autenticação real com Supabase Auth (email/senha)
- 🔄 Sincronização em tempo real (WebSockets)
- 🤖 Sugestões inteligentes com Gemini 2.5 Flash Lite
- 📱 PWA completo (iOS, Android, Desktop)
- 🔔 Push Notifications (Web Push + Email)
- 📷 OCR de notas fiscais (Tesseract.js)
- 🎨 Design System iOS-style
- 📊 Histórico de compras e insights

Para detalhes completos das funcionalidades, consulte `FUNCIONALIDADES_1311.md` (4.147 linhas de documentação).
