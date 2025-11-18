# 🤖 CLAUDE.md — Guia de Desenvolvimento do Compr.AI

Este documento contém instruções essenciais para desenvolver o Compr.AI usando Claude Code.

**Regras:**
- Sempre criar testes quando possível
- NÃO criar arquivos .md desnecessários

---

## 📋 Visão Geral

**Nome:** Compr.AI
**Tipo:** PWA de Lista de Compras Inteligente com IA

### Stack Principal

- **Frontend:** React 19.2 + Vite 7.2 + TypeScript 5.9 + Tailwind CSS 3.4
- **Backend API:** Vercel Functions (Node.js/TypeScript serverless)
- **Database:** Supabase (PostgreSQL + Realtime)
- **IA:** Google Gemini 2.5 Flash Lite (OBRIGATÓRIO usar este modelo)
- **Armazenamento Local:** Dexie.js v5 (IndexedDB)
- **PWA:** vite-plugin-pwa + Workbox
- **Notificações:** Web Push + Resend
- **Deploy:** Vercel + Supabase
- **Testes:** Vitest 4.0.8 + React Testing Library
- **Charts:** Recharts (para estatísticas)

---

## 🎯 Releases e Prioridades

### Releases Implementadas

1. **Release 1** — MVP Base (CRUD, IndexedDB, PWA, Supabase)
2. **Release 2** — Compartilhamento (códigos, realtime sync)
3. **Release 3** — IA Sugestões (Gemini, histórico, autocomplete)
4. **Release 4** — OCR (Tesseract.js, notas fiscais)
5. **Release 5** — Chat e Previsão (chat IA, estatísticas, previsão gastos)

### Prioridades

1. **Funcionalidade antes de estética**
2. **Offline-first** - Tudo funciona localmente antes de sincronizar
3. **Segurança** - Validação, proteção XSS/SQL injection
4. **Performance** - Lazy loading, code splitting
5. **UX Mobile** - Mobile-first, gestos nativos

---

## 🏗️ Estrutura Essencial

```
comprai/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/
│   │   ├── auth/ProtectedRoute.tsx
│   │   ├── layout/(Header, BottomTabBar, Layout)
│   │   ├── lists/(ListCard, ShareModal, JoinModal, Members...)
│   │   ├── items/(ItemRow, ItemModal, ItemInput)
│   │   ├── scanner/(ReceiptScanner, OCR...)
│   │   ├── suggestions/SuggestionsBanner.tsx
│   │   ├── chat/ChatInterface.tsx
│   │   ├── predictions/PredictionModal.tsx
│   │   └── notifications/(PushNotificationsManager...)
│   ├── contexts/(AuthContext, ListsContext, ThemeContext)
│   ├── pages/(Landing, Login, Home, ListDetail, History, Profile, Scanner, Stats)
│   ├── hooks/
│   │   ├── useLocal(Lists/Items).ts
│   │   ├── useSupabase(Lists/Items).ts
│   │   ├── useSync.ts, useRealtimeSync.ts
│   │   ├── useSuggestions.ts, useListSuggestions.ts
│   │   ├── useOCR.ts, useReceiptProcessing.ts
│   │   ├── usePurchaseHistory.ts, usePriceEstimation.ts
│   │   ├── useChat.ts, useStatistics.ts
│   │   └── usePushNotifications.ts
│   ├── lib/
│   │   ├── supabase.ts (cliente Supabase)
│   │   ├── db.ts (Dexie v5)
│   │   └── sharing.ts
│   └── types/(database.ts, index.ts)
├── api/ (Vercel Functions)
│   ├── suggest-items.ts
│   ├── chat.ts
│   ├── process-receipt.ts
│   ├── normalize-item.ts
│   └── notify-members.ts
├── supabase/migrations/ (15 migrations)
└── tests/
```

---

## 🔧 Setup Crítico

### Variáveis de Ambiente (.env.local)

```env
# Frontend (prefixo VITE_)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_VAPID_PUBLIC_KEY=sua-vapid-key

# Backend (Vercel Functions)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key
GEMINI_API_KEY=sua-gemini-key
RESEND_API_KEY=sua-resend-key
VAPID_PUBLIC_KEY=sua-vapid-public
VAPID_PRIVATE_KEY=sua-vapid-private
```

### Supabase Client (src/lib/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'comprai-auth-token'
  }
});
```

### Dexie v5 (src/lib/db.ts)

```typescript
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
  createdAt: Date;
  updatedAt: Date;
}

export class CompraiDB extends Dexie {
  shoppingLists!: Table<ShoppingList, string>;
  shoppingItems!: Table<ShoppingItem, string>;
  purchaseHistory!: Table<PurchaseHistory, string>;
  priceHistory!: Table<PriceHistory, string>;
  sharedLists!: Table<SharedList, string>;
  listMembers!: Table<ListMember, string>;

  constructor() {
    super('CompraiDB');
    this.version(5).stores({
      shoppingLists: 'id, isLocal, syncedAt, updatedAt',
      shoppingItems: 'id, listId, checked, createdAt',
      purchaseHistory: 'id, userId, itemName, purchasedAt',
      priceHistory: 'id, userId, itemName, purchasedAt',
      sharedLists: 'id, listId, shareCode',
      listMembers: 'id, listId, userId, isActive'
    });
  }
}

export const db = new CompraiDB();
```

### Vercel Function Exemplo (api/suggest-items.ts)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, prompt, listType } = req.body;

    // Gemini 2.5 Flash Lite (OBRIGATÓRIO)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const systemPrompt = `Você é assistente de lista de compras. Retorne JSON válido...`;
    const result = await model.generateContent(systemPrompt);
    const suggestions = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());

    return res.status(200).json(suggestions);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 📝 Padrões de Código

### TypeScript

- **Sempre tipar** tudo (evitar `any`)
- Usar `interface` para objetos, `type` para unions
- Validação com Zod quando aplicável

### Componentes React

```typescript
interface ListCardProps {
  list: ShoppingList;
  onEdit: (id: string) => void;
}

export const ListCard: React.FC<ListCardProps> = ({ list, onEdit }) => {
  return <div>{list.name}</div>;
};
```

### Hooks Personalizados

```typescript
export const useLocalLists = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.shoppingLists.toArray().then(setLists).finally(() => setLoading(false));
  }, []);

  const createList = async (name: string) => {
    const newList = { id: crypto.randomUUID(), name, createdAt: new Date(), isLocal: true };
    await db.shoppingLists.add(newList);
    setLists([...lists, newList]);
    return newList;
  };

  return { lists, loading, createList };
};
```

### Tratamento de Erros

```typescript
try {
  await supabase.from('shopping_lists').insert(data);
} catch (error) {
  if (error instanceof Error) {
    console.error('Erro:', error.message);
    setError(`Falha: ${error.message}`);
  }
}
```

---

## 🗄️ Schema do Banco (Resumo)

### Tabelas Principais

**shopping_lists**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**shopping_items**
- `id` (UUID, PK)
- `list_id` (UUID, FK → shopping_lists)
- `name`, `quantity`, `unit`, `category`
- `checked` (BOOLEAN)
- `checked_by_user_id` (UUID, FK → auth.users)
- `deleted` (BOOLEAN), `deleted_at` (TIMESTAMPTZ)
- `created_at`, `updated_at`

**purchase_history**
- `id`, `user_id`, `item_name`, `category`, `quantity`, `unit`, `purchased_at`, `list_id`

**price_history**
- `id`, `user_id`, `item_name`, `price`, `store`, `purchased_at`

**shared_lists**
- `id`, `list_id`, `share_code` (UNIQUE), `owner_user_id`
- `permission` ('edit' | 'readonly')
- `single_use`, `used`, `used_at`

**list_members**
- `id`, `list_id`, `user_id`, `joined_at`, `is_active`

**user_profiles**
- `user_id` (PK, FK → auth.users)
- `nickname`, `avatar_url`
- `push_subscription` (JSONB)

### Triggers Importantes

**log_purchase()** - Registra automaticamente itens marcados como comprados em `purchase_history`

**create_user_profile()** - Cria perfil automaticamente ao registrar usuário

### RLS (Row Level Security)

- Usuários acessam apenas suas próprias listas
- Membros de listas compartilhadas têm acesso via `list_members`
- Perfis públicos são visíveis a todos (SELECT)

---

## 🔐 Segurança

### Validação com Zod

```typescript
import { z } from 'zod';

const listSchema = z.object({
  name: z.string().min(1).max(100)
});

const itemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.enum(['un', 'kg', 'g', 'L', 'ml'])
});
```

### Sanitização

```typescript
const sanitize = (input: string) => input.trim().replace(/[<>]/g, '').substring(0, 200);
```

### SQL Injection

✅ Usar sempre query builders do Supabase (já protegido automaticamente)

---

## 🧪 Testes

### Framework: Vitest + React Testing Library

```bash
npm test              # Watch mode
npm run test:ui       # Interface visual
npm run test:coverage # Cobertura
```

### Arquivos Testados

- `AuthContext.test.tsx`
- `useSupabaseLists.test.tsx`
- `useSupabaseItems.test.tsx`
- `useSuggestions.test.tsx`
- `sharing.test.ts`
- `suggest-items.test.ts` (API)
- `notify-members.test.ts` (API)

**Cobertura atual:** ~15% (9 de 61 arquivos)

### Exemplo

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSupabaseLists } from './useSupabaseLists';

describe('useSupabaseLists', () => {
  it('cria lista', async () => {
    const { result } = renderHook(() => useSupabaseLists());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const list = await result.current.createList('Feira');
    expect(list.name).toBe('Feira');
  });
});
```

---

## 🚀 Deploy

### Vercel (Frontend + API)

```bash
npm i -g vercel
vercel login
vercel                    # Deploy dev
vercel --prod             # Deploy produção
```

**Configurar variáveis:**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add GEMINI_API_KEY
# ... etc
```

### Supabase (Database)

```bash
npm i -g supabase
supabase login
supabase link --project-ref seu-projeto-ref
supabase db push  # Aplicar migrations
```

---

## 📊 Estado Atual

### Releases

- ✅ Release 1 — MVP Base
- ✅ Release 2 — Compartilhamento
- ✅ Release 3 — IA Sugestões
- ✅ Release 4 — OCR (parcial)
- ✅ Release 5 — Chat e Previsão (completo)

### Estatísticas

- **Componentes:** 23 arquivos
- **Hooks:** 21 arquivos
- **Páginas:** 9 arquivos
- **API Functions:** 6 arquivos
- **Migrations:** 15 arquivos
- **Testes:** 9 arquivos (~15% cobertura)

### Features Principais

- 🔐 Autenticação Supabase Auth
- 🔄 Sincronização em tempo real (WebSockets)
- 🤖 IA com Gemini 2.5 Flash Lite (sugestões + chat contextual)
- 📱 PWA completo (iOS, Android, Desktop)
- 🔔 Push Notifications (Web Push + Email)
- 📷 OCR de notas fiscais (Tesseract.js)
- 📊 Dashboard estatísticas + previsão gastos (Recharts)
- 🎨 Design iOS-style (Liquid Glass, BottomTabBar)
- 💾 Offline-first com IndexedDB

### Modelo de IA OBRIGATÓRIO

**CRÍTICO:** Sempre usar `gemini-2.5-flash-lite` em todas as APIs:
- `api/suggest-items.ts`
- `api/chat.ts`
- `api/process-receipt.ts`

---

## 🎨 Convenções de Commits

```
feat: adiciona nova feature
fix: corrige bug
refactor: melhora código sem mudar funcionalidade
docs: atualiza documentação
style: formatação
test: adiciona testes
chore: tarefas gerais
```

---

## 📚 Links Essenciais

- **React:** https://react.dev
- **Supabase:** https://supabase.com/docs
- **Gemini AI:** https://ai.google.dev/docs
- **Vitest:** https://vitest.dev

---

**Última atualização:** 2025-11-18
**Versão:** 2.0.0 (Condensada)

Para documentação completa de funcionalidades, consulte `FUNCIONALIDADES_1311.md`.
