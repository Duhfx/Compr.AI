# 🛒 Compr.AI — Roadmap Detalhado de Implementação

**Tipo:** PWA Inteligente de Lista de Compras
**Stack:** React + Vite + TypeScript (frontend) · Vercel Functions (API) · Supabase (DB/Realtime) · Gemini AI
**Modelo de Deploy:** Frontend + API na Vercel (gratuito) · Supabase para PostgreSQL (tier gratuito)

---

## 📋 Índice

1. [Arquitetura Geral](#-arquitetura-geral)
2. [Release 1 — MVP Base](#-release-1--mvp-base)
3. [Release 2 — Compartilhamento](#-release-2--compartilhamento-e-sincronização)
4. [Release 3 — IA Sugestões](#-release-3--inteligência-de-sugestões)
5. [Release 4 — OCR](#-release-4--ocr-e-notas-fiscais)
6. [Release 5 — Chat e Previsão](#-release-5--chat-e-previsão-de-gastos)
7. [Tecnologias e Custos](#-tecnologias-e-custos-gratuitos)

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
│                    (Browser / Mobile)                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND PWA (Vercel)                     │
│   React + Vite + TypeScript + Tailwind CSS                  │
│   • IndexedDB (Dexie.js) - armazenamento offline            │
│   • Service Worker - cache de assets                        │
│   • Tesseract.js - OCR local (Release 4)                    │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│   SUPABASE (Free Tier)   │   │  VERCEL FUNCTIONS (Node.js) │
│  • PostgreSQL 500MB      │   │  • TypeScript serverless    │
│  • Realtime subscriptions│   │  • Gemini AI proxy          │
│  • Storage (fotos NF)    │   │  • /api/suggest-items       │
│  • Auth anônima (UUID)   │   │  • /api/process-receipt     │
└──────────────────────────┘   │  • /api/chat                │
                               │  • /api/economy-tips        │
                               └────────────┬────────────────┘
                                            │
                                            ▼
                               ┌────────────────────────────┐
                               │      GEMINI AI 1.5         │
                               │  • Flash: sugestões rápidas│
                               │  • Pro: OCR e chat         │
                               └────────────────────────────┘
```

### Divisão de Responsabilidades

**Frontend (React PWA):**
- Interface do usuário
- Armazenamento local (IndexedDB)
- Modo offline
- OCR local (Tesseract.js)

**Supabase:**
- PostgreSQL (armazenamento persistente)
- Realtime (sincronização automática)
- Storage (fotos de notas fiscais)

**Vercel Functions (Node.js/TypeScript):**
- Proxy seguro para Gemini AI
- Processamento de IA pesado
- Lógica de negócio complexa

---

## 🧩 Release 1 — MVP Base

### 🎯 Objetivo
Criar aplicação funcional que permite gerenciar listas de compras com armazenamento local e sincronização básica.

### 📦 Features

#### 1.1. Estrutura de Dados Local (IndexedDB)

**Tabelas:**

```typescript
// IndexedDB via Dexie.js
interface ShoppingList {
  id: string;              // UUID
  name: string;            // "Feira da Semana"
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;         // Última sincronização
  isLocal: boolean;        // Se é apenas local ou já sincronizada
}

interface ShoppingItem {
  id: string;
  listId: string;          // FK para ShoppingList
  name: string;
  quantity: number;
  unit: string;            // "un", "kg", "L"
  category?: string;       // "Laticínios", "Limpeza"
  checked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDevice {
  deviceId: string;        // UUID gerado no primeiro acesso
  nickname: string;        // "João's iPhone"
  lastSyncAt?: Date;
}
```

#### 1.2. UI/UX Básico

**Páginas:**

1. **Home (`/`)**
   - Lista de todas as listas criadas
   - Botão "Nova Lista"
   - Card por lista mostrando: nome, quantidade de itens, itens marcados

2. **Detalhe da Lista (`/list/:id`)**
   - Nome da lista (editável)
   - Input para adicionar item rápido
   - Lista de itens com checkbox
   - Botão "Editar Item" (modal)
   - Botão "Excluir Item"
   - Contador: "3 de 10 itens comprados"

3. **Criar/Editar Item (Modal)**
   - Nome do produto
   - Quantidade
   - Unidade (dropdown: un, kg, L, g, ml)
   - Categoria (opcional, lista fixa inicial)

**Componentes Principais:**

```
src/
├── components/
│   ├── ListCard.tsx          // Card de lista na home
│   ├── ItemRow.tsx           // Linha de item com checkbox
│   ├── ItemModal.tsx         // Modal criar/editar item
│   ├── Layout.tsx            // Header + Footer
│   └── OfflineIndicator.tsx  // Badge "Modo Offline"
├── pages/
│   ├── Home.tsx
│   └── ListDetail.tsx
├── hooks/
│   ├── useLocalLists.ts      // CRUD de listas locais
│   ├── useLocalItems.ts      // CRUD de itens locais
│   └── useOfflineStatus.ts   // Detecta online/offline
├── services/
│   ├── db.ts                 // Configuração Dexie
│   └── sync.ts               // Sincronização (Release 1: básica)
└── lib/
    └── supabase.ts           // Cliente Supabase
```

#### 1.3. PWA Setup

**Arquivos Necessários:**

- `public/manifest.json` - Metadados do app
- `public/icons/` - Ícones 192x192 e 512x512
- `vite.config.ts` com plugin PWA (vite-plugin-pwa)
- Service Worker para cache de assets

**manifest.json:**

```json
{
  "name": "Compr.AI - Lista de Compras Inteligente",
  "short_name": "Compr.AI",
  "description": "Seu assistente de compras com IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 1.4. Supabase Setup (Release 1)

**Tabelas no PostgreSQL:**

```sql
-- Tabela de dispositivos (auth anônima)
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de listas
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
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

-- Índices
CREATE INDEX idx_lists_device ON shopping_lists(device_id);
CREATE INDEX idx_items_list ON shopping_items(list_id);
```

#### 1.5. Sincronização Básica (Upload/Download)

**Fluxo:**

1. **Primeira vez:** Usuário cria deviceId (UUID) e salva em localStorage
2. **Criar lista local:** salva em IndexedDB com `isLocal: true`
3. **Botão "Sincronizar"** (ou automático ao voltar online):
   - Envia listas locais para Supabase
   - Baixa listas do servidor que não existem localmente
   - Atualiza `syncedAt` em ambos

**Código de Referência (useSync.ts):**

```typescript
export const useSync = () => {
  const uploadLists = async (deviceId: string) => {
    const localLists = await db.shoppingLists
      .where('isLocal').equals(true)
      .toArray();

    for (const list of localLists) {
      const { data, error } = await supabase
        .from('shopping_lists')
        .upsert({
          id: list.id,
          device_id: deviceId,
          name: list.name,
          created_at: list.createdAt,
          updated_at: list.updatedAt
        });

      if (!error) {
        await db.shoppingLists.update(list.id, {
          isLocal: false,
          syncedAt: new Date()
        });
      }
    }
  };

  // downloadLists similar...
};
```

### ✅ Critérios de Conclusão (Release 1)

- [ ] Usuário consegue criar, editar e excluir listas
- [ ] Usuário consegue adicionar, editar e marcar itens
- [ ] Dados persistem localmente (offline funciona)
- [ ] PWA instalável no celular/desktop
- [ ] Sincronização manual funciona (botão)
- [ ] UI responsiva (mobile-first)

### 🛠️ Stack Técnico

- **Frontend:** React 18 + Vite 5 + TypeScript 5
- **Estilização:** Tailwind CSS 3 + shadcn/ui
- **Banco Local:** Dexie.js (wrapper IndexedDB)
- **Backend:** Supabase (PostgreSQL + API REST)
- **Deploy:** Vercel (frontend gratuito)

### ⏱️ Estimativa
**2-3 semanas** (40-60h desenvolvimento)

---

## 🤝 Release 2 — Compartilhamento e Sincronização

### 🎯 Objetivo
Permitir que usuários compartilhem listas com outras pessoas e sincronizem automaticamente as alterações.

### 📦 Features

#### 2.1. Sistema de Compartilhamento

**Nova Tabela Supabase:**

```sql
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL, -- Código de 6 dígitos (ex: "ABC123")
  owner_device_id UUID REFERENCES devices(id),
  permission TEXT DEFAULT 'edit', -- 'edit' ou 'readonly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Opcional: expiração do link
);

CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE -- Se ainda tem acesso
);

CREATE INDEX idx_share_code ON shared_lists(share_code);
CREATE INDEX idx_members_list ON list_members(list_id);
```

#### 2.2. Fluxo de Compartilhamento

**UI:**

1. **Botão "Compartilhar" na página da lista**
   - Gera código de 6 caracteres aleatórios
   - Mostra modal com código + link copiável
   - Opção de definir permissão (edição/leitura)

2. **Tela "Entrar em Lista Compartilhada"**
   - Input para código de 6 dígitos
   - Valida no backend
   - Adiciona lista ao dispositivo local

3. **Indicador Visual**
   - Badge "Compartilhada" no card da lista
   - Avatar dos membros ativos
   - Status de sincronização em tempo real

**Código (ShareListModal.tsx):**

```typescript
const generateShareCode = async (listId: string, deviceId: string) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('shared_lists')
    .insert({
      list_id: listId,
      share_code: code,
      owner_device_id: deviceId,
      permission: 'edit'
    })
    .select()
    .single();

  return data?.share_code;
};

const joinSharedList = async (code: string, deviceId: string) => {
  // Busca lista pelo código
  const { data: sharedList } = await supabase
    .from('shared_lists')
    .select('*, shopping_lists(*)')
    .eq('share_code', code)
    .single();

  if (!sharedList) throw new Error('Código inválido');

  // Adiciona membro
  await supabase
    .from('list_members')
    .insert({
      list_id: sharedList.list_id,
      device_id: deviceId
    });

  // Salva lista localmente
  await db.shoppingLists.add({
    id: sharedList.shopping_lists.id,
    name: sharedList.shopping_lists.name,
    isLocal: false,
    syncedAt: new Date()
  });
};
```

#### 2.3. Sincronização em Tempo Real

**Supabase Realtime:**

```typescript
// useRealtimeSync.ts
export const useRealtimeSync = (listId: string) => {
  useEffect(() => {
    const channel = supabase
      .channel(`list:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${listId}`
        },
        (payload) => {
          // Atualiza IndexedDB local
          if (payload.eventType === 'INSERT') {
            db.shoppingItems.add(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            db.shoppingItems.update(payload.new.id, payload.new);
          } else if (payload.eventType === 'DELETE') {
            db.shoppingItems.delete(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId]);
};
```

#### 2.4. Resolução de Conflitos

**Estratégia: Last-Write-Wins (LWW)**

- Campo `updated_at` define versão mais recente
- Cliente sempre verifica timestamp antes de aplicar mudança
- Se houver conflito, versão do servidor prevalece

**Alternativa: Operational Transformation (complexo, futuro)**

### ✅ Critérios de Conclusão (Release 2)

- [ ] Usuário consegue gerar código de compartilhamento
- [ ] Usuário consegue entrar em lista com código
- [ ] Alterações sincronizam em tempo real entre dispositivos
- [ ] UI mostra membros conectados
- [ ] Conflitos são resolvidos automaticamente
- [ ] Funciona offline (sincroniza ao reconectar)

### ⏱️ Estimativa
**2-3 semanas** (40-60h desenvolvimento)

---

## 🧠 Release 3 — Inteligência de Sugestões

### 🎯 Objetivo
Tornar o app proativo, sugerindo itens baseados em histórico e interpretando texto livre.

### 📦 Features

#### 3.1. Histórico de Compras

**Nova Tabela:**

```sql
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  unit TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  list_id UUID REFERENCES shopping_lists(id) -- De qual lista veio
);

-- Índice para buscas rápidas
CREATE INDEX idx_history_device ON purchase_history(device_id, purchased_at DESC);
CREATE INDEX idx_history_item ON purchase_history(item_name);
```

**Trigger Automático:**

```sql
-- Quando item é marcado como comprado, registra no histórico
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
FOR EACH ROW EXECUTE FUNCTION log_purchase();
```

#### 3.2. Sugestões Automáticas

**Vercel Function (`/api/suggest-items.ts`):**

```typescript
// api/suggest-items.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { deviceId, prompt, listType } = req.body;

  // Cliente Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service key para acesso admin
  );

  // Busca histórico do usuário (últimos 50 itens)
  const { data: history } = await supabase
    .from('purchase_history')
    .select('item_name, category, quantity, unit')
    .eq('device_id', deviceId)
    .order('purchased_at', { ascending: false })
    .limit(50);

  // Prompt para Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `
Você é assistente de lista de compras.
Histórico do usuário: ${JSON.stringify(history)}

Tarefa: Sugerir itens para "${listType || 'compras gerais'}".
${prompt ? `Contexto adicional: ${prompt}` : ''}

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
}
```

#### 3.3. Autocompletar Inteligente

**No frontend (ItemInput.tsx):**

```typescript
const [suggestions, setSuggestions] = useState<string[]>([]);

// Busca no histórico local + cache de sugestões da IA
const getSuggestions = async (input: string) => {
  // 1. Buscar no histórico local
  const localMatches = await db.purchaseHistory
    .where('item_name')
    .startsWithIgnoreCase(input)
    .limit(5)
    .toArray();

  // 2. Se não houver matches, consultar IA (debounced)
  if (localMatches.length === 0 && input.length > 3) {
    const response = await fetch('/api/suggest-items', {
      method: 'POST',
      body: JSON.stringify({
        deviceId,
        prompt: input,
        maxResults: 5
      })
    });
    const aiSuggestions = await response.json();
    return aiSuggestions.items.map(i => i.name);
  }

  return localMatches.map(m => m.item_name);
};
```

#### 3.4. Interpretação de Texto Livre

**Feature: "Criar lista de churrasco"**

```typescript
// Botão "Criar lista com IA"
const createListFromPrompt = async (prompt: string) => {
  const response = await fetch('/api/suggest-items', {
    method: 'POST',
    body: JSON.stringify({
      deviceId,
      prompt,
      listType: 'interpretação livre' // flag especial
    })
  });

  const { items } = await response.json();

  // Cria lista e adiciona itens
  const listId = await db.shoppingLists.add({
    name: prompt,
    createdAt: new Date(),
    isLocal: true
  });

  for (const item of items) {
    await db.shoppingItems.add({
      ...item,
      listId,
      checked: false
    });
  }

  return listId;
};
```

#### 3.5. Padronização de Nomes

**Vercel Function (`/api/normalize-item.ts`):**

```typescript
// api/normalize-item.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { rawName } = req.body;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(`
Normalize o nome do produto: "${rawName}"
Retorne apenas o nome padronizado (capitalizado, unidade no final).
Exemplos:
- "leite integral itambé" → "Leite Integral 1L"
- "ARROZ TIPO 1 5KG" → "Arroz Tipo 1 5kg"
`);

  return res.status(200).json({
    normalized: result.response.text().trim()
  });
}
```

### ✅ Critérios de Conclusão (Release 3)

- [ ] Histórico de compras é registrado automaticamente
- [ ] Sugestões aparecem ao digitar item
- [ ] Botão "Criar lista com IA" funciona
- [ ] IA interpreta texto livre ("lista de café da manhã")
- [ ] Nomes de produtos são padronizados
- [ ] Sugestões são baseadas em histórico pessoal

### ⏱️ Estimativa
**3-4 semanas** (60-80h desenvolvimento)

---

## 📸 Release 4 — OCR e Notas Fiscais

### 🎯 Objetivo
Automatizar registro de preços e criar histórico de valores dos produtos.

### 📦 Features

#### 4.1. Captura de Imagem

**UI (Scanner.tsx):**

```typescript
// Input de câmera ou upload
<input
  type="file"
  accept="image/*"
  capture="environment" // Abre câmera traseira
  onChange={handleImageCapture}
/>

// Ou usando biblioteca moderna
import { Camera } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera
  });

  return image.base64String;
};
```

#### 4.2. OCR Local (Tesseract.js)

**Alternativa: Tesseract.js (100% gratuito e offline)**

```typescript
// lib/ocr.ts
import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imageBase64: string) => {
  const result = await Tesseract.recognize(
    `data:image/jpeg;base64,${imageBase64}`,
    'por', // Português
    {
      logger: (m) => console.log(m) // Progresso
    }
  );

  return result.data.text;
};
```

**Problema:** Tesseract é pesado (~10MB). Alternativa:

**Cloud Vision API Gratuita:**

- **Google Cloud Vision:** 1000 requisições/mês grátis
- **Azure Computer Vision:** 5000 requisições/mês grátis

#### 4.3. Estruturação com Gemini

**Vercel Function (`/api/process-receipt.ts`):**

```typescript
// api/process-receipt.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ocrText, deviceId } = req.body;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
Analise o texto de nota fiscal:
---
${ocrText}
---

Extraia produtos e valores no formato JSON (sem markdown):
{
  "store": "Nome do Mercado",
  "date": "2024-01-15",
  "items": [
    {
      "name": "Leite Integral 1L",
      "quantity": 2,
      "unitPrice": 5.99,
      "totalPrice": 11.98,
      "category": "Laticínios"
    }
  ],
  "total": 11.98
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, '').trim();
  const structured = JSON.parse(text);

  // Cliente Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Salva no histórico de preços
  for (const item of structured.items) {
    await supabase
      .from('price_history')
      .insert({
        device_id: deviceId,
        item_name: item.name,
        price: item.unitPrice,
        store: structured.store,
        purchased_at: structured.date
      });
  }

  return res.status(200).json(structured);
}
```

#### 4.4. Nova Tabela de Preços

```sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  store TEXT,
  purchased_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_item ON price_history(item_name, purchased_at DESC);
```

#### 4.5. Fluxo Completo

1. Usuário clica "Escanear Nota Fiscal"
2. Captura foto ou faz upload
3. Frontend envia imagem para OCR (Cloud Vision ou Tesseract)
4. OCR retorna texto bruto
5. Frontend envia texto para Edge Function `/process-receipt`
6. Gemini estrutura dados
7. Backend salva em `price_history`
8. Frontend mostra preview: "Deseja adicionar estes itens à lista?"

### ✅ Critérios de Conclusão (Release 4)

- [ ] Usuário consegue tirar foto da nota fiscal
- [ ] Texto é extraído corretamente (90%+ precisão)
- [ ] Gemini estrutura itens e preços
- [ ] Histórico de preços é salvo
- [ ] UI mostra confirmação antes de adicionar itens
- [ ] Funciona com principais redes de supermercados

### ⏱️ Estimativa
**3-4 semanas** (60-80h desenvolvimento)

---

## 💬 Release 5 — Chat e Previsão de Gastos

### 🎯 Objetivo
Transformar Compr.AI em assistente completo de compras com insights inteligentes.

### 📦 Features

#### 5.1. Chat Contextual

**UI (ChatInterface.tsx):**

```typescript
// Estilo WhatsApp
<div className="chat-container">
  {messages.map(msg => (
    <div className={msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}>
      {msg.content}
    </div>
  ))}
  <input
    placeholder="Pergunte sobre suas compras..."
    onSubmit={sendMessage}
  />
</div>
```

**Vercel Function (`/api/chat.ts`):**

```typescript
// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { message, deviceId, conversationHistory } = req.body;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Busca contexto do usuário
  const [lists, history, prices] = await Promise.all([
    supabase.from('shopping_lists')
      .select('*, shopping_items(*)')
      .eq('device_id', deviceId)
      .limit(5),
    supabase.from('purchase_history')
      .select('*')
      .eq('device_id', deviceId)
      .limit(100),
    supabase.from('price_history')
      .select('*')
      .eq('device_id', deviceId)
      .limit(100)
  ]);

  const context = `
Contexto do usuário:
- Listas ativas: ${lists.data?.length || 0}
- Histórico: ${history.data?.length || 0} compras
- Produtos mais comprados: ${getMostPurchased(history.data || [])}
- Gastos médios: R$ ${getAverageSpending(prices.data || [])}
`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: `
Você é assistente de compras. Responda perguntas sobre:
- Listas de compras
- Histórico de compras
- Preços e economia
- Sugestões de produtos

${context}
`
  });

  const chat = model.startChat({
    history: conversationHistory || []
  });

  const result = await chat.sendMessage(message);

  return res.status(200).json({
    response: result.response.text()
  });
}

// Funções auxiliares
function getMostPurchased(history: any[]) {
  // Implementar lógica
  return history.slice(0, 5).map(h => h.item_name).join(', ');
}

function getAverageSpending(prices: any[]) {
  if (!prices.length) return '0.00';
  const total = prices.reduce((sum, p) => sum + Number(p.price), 0);
  return (total / prices.length).toFixed(2);
}
```

#### 5.2. Previsão de Gastos

**Algoritmo:**

```typescript
// lib/predictions.ts
export const predictTotalCost = async (listId: string, deviceId: string) => {
  const items = await db.shoppingItems
    .where('listId').equals(listId)
    .toArray();

  let totalEstimated = 0;
  let confidence = 0;

  for (const item of items) {
    // Busca preços históricos do item
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('price')
      .eq('device_id', deviceId)
      .ilike('item_name', `%${item.name}%`)
      .order('purchased_at', { ascending: false })
      .limit(5);

    if (priceHistory.length > 0) {
      // Média dos últimos 5 preços
      const avgPrice = priceHistory.reduce((sum, p) => sum + p.price, 0)
                       / priceHistory.length;
      totalEstimated += avgPrice * item.quantity;
      confidence += priceHistory.length / 5; // Quanto mais dados, maior confiança
    } else {
      // Sem histórico: consulta IA para estimativa
      const estimate = await estimatePriceWithAI(item.name, item.quantity, item.unit);
      totalEstimated += estimate;
      confidence += 0.3; // Baixa confiança
    }
  }

  confidence = Math.min(confidence / items.length, 1) * 100;

  return {
    total: totalEstimated,
    confidence: Math.round(confidence),
    breakdown: items.map(/* detalhes por item */)
  };
};
```

#### 5.3. Dicas de Economia

**Vercel Function (`/api/economy-tips.ts`):**

```typescript
// api/economy-tips.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { listId, deviceId } = req.body;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Busca itens da lista
  const { data: items } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('list_id', listId);

  // Busca histórico de preços
  const { data: priceHistory } = await supabase
    .from('price_history')
    .select('*')
    .eq('device_id', deviceId)
    .order('purchased_at', { ascending: false })
    .limit(100);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const result = await model.generateContent(`
Analise a lista de compras e histórico de preços:

Lista: ${JSON.stringify(items)}
Histórico: ${JSON.stringify(priceHistory)}

Dê 3 dicas de economia específicas para esta lista.
Formato:
- [Produto X]: Você costuma pagar R$ Y. Experimente marca Z, 15% mais barata.
`);

  return res.status(200).json({
    tips: result.response.text()
  });
}
```

#### 5.4. Estatísticas

**Dashboard de Insights:**

```typescript
// pages/Stats.tsx
const Stats = () => {
  const [stats, setStats] = useState({
    totalSpent: 0,
    mostPurchased: [],
    monthlyAverage: 0,
    priceVariations: []
  });

  useEffect(() => {
    const loadStats = async () => {
      const history = await db.purchaseHistory.toArray();
      const prices = await db.priceHistory.toArray();

      setStats({
        totalSpent: prices.reduce((sum, p) => sum + p.price, 0),
        mostPurchased: getMostPurchased(history),
        monthlyAverage: calculateMonthlyAverage(prices),
        priceVariations: calculatePriceVariations(prices)
      });
    };

    loadStats();
  }, []);

  return (
    <div>
      <h1>Estatísticas</h1>
      <Card title="Gasto Total" value={`R$ ${stats.totalSpent}`} />
      <Card title="Mais Comprados" list={stats.mostPurchased} />
      {/* Gráficos com Recharts */}
    </div>
  );
};
```

### ✅ Critérios de Conclusão (Release 5)

- [ ] Chat responde perguntas contextuais
- [ ] Previsão de gastos funciona com 70%+ de precisão
- [ ] Dicas de economia são relevantes
- [ ] Dashboard de estatísticas completo
- [ ] Gráficos de variação de preços
- [ ] Histórico de conversas salvo

### ⏱️ Estimativa
**4-5 semanas** (80-100h desenvolvimento)

---

## 💰 Tecnologias e Custos (100% Gratuito)

### Frontend + Backend API

| Serviço | Tier Gratuito | Uso |
|---------|---------------|-----|
| **Vercel** | 100GB bandwidth/mês + 100GB-hours compute | Hospedagem PWA + Serverless Functions |
| **Cloudflare Pages** | Ilimitado | Alternativa Vercel (só frontend) |

**Vercel Functions - Limites Gratuitos:**
- 100GB-hours de execução/mês
- Timeout: 10s por função (suficiente para Gemini)
- Deploy automático via Git
- Sem cold start perceptível

### Database + Realtime

| Serviço | Tier Gratuito | Uso |
|---------|---------------|-----|
| **Supabase** | 500MB DB + 2GB storage + Realtime incluído | PostgreSQL + sincronização automática |
| **Neon.tech** | 3GB PostgreSQL forever free | Alternativa (sem Realtime) |

### IA

| Serviço | Tier Gratuito | Uso |
|---------|---------------|-----|
| **Google Gemini 1.5 Flash** | 15 req/min gratuitas | Sugestões rápidas, normalização |
| **Google Gemini 1.5 Pro** | 2 req/min gratuitas | OCR estruturado, chat contextual |
| **Google Cloud Vision** | 1000 req/mês | OCR (alternativa ao Tesseract) |

### Ferramentas

| Serviço | Tier Gratuito | Uso |
|---------|---------------|-----|
| **Tesseract.js** | 100% gratuito | OCR offline no navegador |
| **Sentry** | 5K events/mês | Error tracking (futuro) |

### Estimativa de Custo Total
**R$ 0,00/mês** para até ~1000 usuários ativos com uso moderado

---

## 📅 Timeline Completo

| Release | Duração | Total Acumulado |
|---------|---------|-----------------|
| Release 1 - MVP | 2-3 semanas | 3 semanas |
| Release 2 - Compartilhamento | 2-3 semanas | 6 semanas |
| Release 3 - IA Sugestões | 3-4 semanas | 10 semanas |
| Release 4 - OCR | 3-4 semanas | 14 semanas |
| Release 5 - Chat | 4-5 semanas | 19 semanas |

**Total: ~4-5 meses** (assumindo desenvolvimento solo, part-time)

---

## 🚀 Próximos Passos Imediatos

### 1. Setup do Projeto Frontend

```bash
# Criar projeto Vite + React + TypeScript
npm create vite@latest comprai -- --template react-ts
cd comprai
npm install

# Dependências principais
npm install @supabase/supabase-js dexie react-router-dom

# UI e estilização
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# PWA
npm install -D vite-plugin-pwa workbox-window

# Utilities
npm install date-fns uuid zod
npm install -D @types/uuid
```

### 2. Configurar Vercel Functions (Backend API)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Criar pasta de API
mkdir api

# Instalar dependências do backend
npm install @vercel/node @google/generative-ai
```

**Estrutura de pastas:**
```
comprai/
├── api/                      # Vercel Functions (Node.js/TypeScript)
│   ├── suggest-items.ts
│   ├── process-receipt.ts
│   ├── chat.ts
│   └── economy-tips.ts
├── src/                      # Frontend React
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── db.ts
│   ├── hooks/
│   ├── components/
│   └── pages/
└── public/
```

### 3. Criar Conta Supabase

1. Acesse: https://supabase.com/dashboard
2. Criar novo projeto
3. Copiar **URL** e **anon key**
4. Copiar **service_role key** (para uso nas Vercel Functions)

### 4. Configurar Gemini API

1. Acesse: https://aistudio.google.com/app/apikey
2. Gerar API key
3. Guardar para configurar nas variáveis de ambiente

### 5. Configurar Variáveis de Ambiente

**Arquivo `.env.local` (frontend):**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

**No Vercel (para as Functions):**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add GEMINI_API_KEY
```

### 6. Deploy Inicial

```bash
# Deploy frontend + functions
vercel

# Para produção
vercel --prod
```

---

**Última atualização:** 2025-11-12
