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

- **Frontend:** React 18 + Vite 5 + TypeScript 5 + Tailwind CSS 3
- **Backend API:** Vercel Functions (Node.js/TypeScript serverless)
- **Database:** Supabase (PostgreSQL + Realtime)
- **IA:** Google Gemini 1.5 Pro/Flash
- **Armazenamento Local:** Dexie.js (IndexedDB)
- **PWA:** vite-plugin-pwa + Workbox
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
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx      # Header + Footer
│   │   │   ├── Header.tsx
│   │   │   └── OfflineIndicator.tsx
│   │   ├── lists/
│   │   │   ├── ListCard.tsx    # Card de lista na home
│   │   │   ├── CreateListModal.tsx
│   │   │   └── ShareListModal.tsx
│   │   ├── items/
│   │   │   ├── ItemRow.tsx     # Linha de item com checkbox
│   │   │   ├── ItemModal.tsx   # Criar/editar item
│   │   │   └── ItemInput.tsx   # Input com autocomplete
│   │   ├── scanner/
│   │   │   ├── Scanner.tsx     # Captura de nota fiscal
│   │   │   └── ReceiptPreview.tsx
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   └── MessageBubble.tsx
│   │   └── ui/                 # Componentes shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── input.tsx
│   ├── pages/
│   │   ├── Home.tsx            # Lista de listas
│   │   ├── ListDetail.tsx      # Detalhe da lista
│   │   ├── Stats.tsx           # Estatísticas (Release 5)
│   │   └── Settings.tsx        # Configurações
│   ├── hooks/
│   │   ├── useLocalLists.ts    # CRUD listas locais
│   │   ├── useLocalItems.ts    # CRUD itens locais
│   │   ├── useSync.ts          # Sincronização Supabase
│   │   ├── useRealtimeSync.ts  # Realtime (Release 2)
│   │   ├── useSuggestions.ts   # Sugestões IA (Release 3)
│   │   ├── useOCR.ts           # OCR (Release 4)
│   │   ├── useChat.ts          # Chat (Release 5)
│   │   └── useOfflineStatus.ts # Detecta online/offline
│   ├── services/
│   │   ├── api.ts              # Cliente API (fetch wrapper)
│   │   └── predictions.ts      # Algoritmos de previsão
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── db.ts               # Configuração Dexie
│   │   ├── ocr.ts              # OCR (Tesseract.js)
│   │   └── utils.ts            # Utilidades
│   ├── types/
│   │   ├── database.ts         # Types do Supabase
│   │   └── index.ts            # Types gerais
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/                        # Vercel Functions (Backend API)
│   ├── suggest-items.ts        # Sugestões de IA
│   ├── process-receipt.ts      # Processar nota fiscal
│   ├── chat.ts                 # Chat contextual
│   ├── economy-tips.ts         # Dicas de economia
│   └── normalize-item.ts       # Padronizar nomes
├── supabase/
│   └── migrations/             # SQL migrations
│       ├── 001_initial_schema.sql
│       ├── 002_sharing.sql
│       ├── 003_history.sql
│       └── 004_price_history.sql
├── .env.example
├── .env.local                  # Não commitar!
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── ROADMAP_DETALHADO.md        # Roadmap técnico
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

# Supabase (apenas client para DB e Realtime)
npm install @supabase/supabase-js

# IndexedDB
npm install dexie dexie-react-hooks

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# PWA
npm install -D vite-plugin-pwa workbox-window

# Utilities
npm install date-fns uuid zod
npm install -D @types/uuid

# Backend API (Vercel Functions)
npm install @vercel/node @google/generative-ai

# OCR (Release 4)
npm install tesseract.js

# Charts (Release 5)
npm install recharts
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Auth anônima, sem sessão
  }
});
```

**c) Criar arquivo .env.local:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
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
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDevice {
  deviceId: string;
  nickname: string;
  lastSyncAt?: Date;
}

export interface PurchaseHistory {
  id: string;
  deviceId: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit: string;
  purchasedAt: Date;
  listId: string;
}

export interface PriceHistory {
  id: string;
  deviceId: string;
  itemName: string;
  price: number;
  store?: string;
  purchasedAt: Date;
  createdAt: Date;
}

export class CompraiDB extends Dexie {
  shoppingLists!: Table<ShoppingList, string>;
  shoppingItems!: Table<ShoppingItem, string>;
  userDevice!: Table<UserDevice, string>;
  purchaseHistory!: Table<PurchaseHistory, string>;
  priceHistory!: Table<PriceHistory, string>;

  constructor() {
    super('CompraiDB');

    this.version(1).stores({
      shoppingLists: 'id, isLocal, syncedAt',
      shoppingItems: 'id, listId, checked',
      userDevice: 'deviceId',
      purchaseHistory: 'id, deviceId, itemName, purchasedAt',
      priceHistory: 'id, deviceId, itemName, purchasedAt'
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

### Migration 1: Schema Inicial (Release 1)

```sql
-- supabase/migrations/001_initial_schema.sql

-- Tabela de dispositivos (auth anônima)
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de listas de compras
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_lists_device ON shopping_lists(device_id);
CREATE INDEX idx_items_list ON shopping_items(list_id);
CREATE INDEX idx_items_checked ON shopping_items(list_id, checked);

-- RLS (Row Level Security) - permite acesso anônimo
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (auth anônima)
CREATE POLICY "Permitir acesso a próprio dispositivo"
  ON devices FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso a listas próprias"
  ON shopping_lists FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso a itens"
  ON shopping_items FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Migration 2: Compartilhamento (Release 2)

```sql
-- supabase/migrations/002_sharing.sql

-- Tabela de listas compartilhadas
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  owner_device_id UUID REFERENCES devices(id),
  permission TEXT DEFAULT 'edit' CHECK (permission IN ('edit', 'readonly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Tabela de membros
CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(list_id, device_id)
);

CREATE INDEX idx_share_code ON shared_lists(share_code);
CREATE INDEX idx_members_list ON list_members(list_id);
CREATE INDEX idx_members_device ON list_members(device_id);

-- RLS
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a compartilhamentos"
  ON shared_lists FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acesso a membros"
  ON list_members FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Migration 3: Histórico (Release 3)

```sql
-- supabase/migrations/003_history.sql

-- Histórico de compras
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  unit TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL
);

CREATE INDEX idx_history_device ON purchase_history(device_id, purchased_at DESC);
CREATE INDEX idx_history_item ON purchase_history(item_name);

-- Trigger para registrar compras automaticamente
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checked = TRUE AND OLD.checked = FALSE THEN
    INSERT INTO purchase_history (device_id, item_name, category, quantity, unit, list_id)
    SELECT sl.device_id, NEW.name, NEW.category, NEW.quantity, NEW.unit, NEW.list_id
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

CREATE POLICY "Acesso ao histórico"
  ON purchase_history FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Migration 4: Preços (Release 4)

```sql
-- supabase/migrations/004_price_history.sql

-- Histórico de preços
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  store TEXT,
  purchased_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_item ON price_history(item_name, purchased_at DESC);
CREATE INDEX idx_price_device ON price_history(device_id);

-- RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso ao histórico de preços"
  ON price_history FOR ALL
  USING (true)
  WITH CHECK (true);
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

## 🧪 Testes (Opcional para Releases Futuras)

### Estrutura de Testes

```
src/
├── __tests__/
│   ├── components/
│   │   └── ListCard.test.tsx
│   ├── hooks/
│   │   └── useLocalLists.test.ts
│   └── services/
│       └── sync.test.ts
```

### Exemplo de Teste

```typescript
// src/__tests__/hooks/useLocalLists.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalLists } from '../../hooks/useLocalLists';

describe('useLocalLists', () => {
  it('deve criar uma nova lista', async () => {
    const { result } = renderHook(() => useLocalLists());

    await act(async () => {
      const list = await result.current.createList('Feira');
      expect(list.name).toBe('Feira');
    });

    expect(result.current.lists).toHaveLength(1);
  });
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

# Variáveis das Vercel Functions (sem prefixo)
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add GEMINI_API_KEY
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

**Última atualização:** 2025-11-12
**Versão:** 1.0.0
