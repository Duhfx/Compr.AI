# 🔌 BACKEND_API.md — Documentação das Vercel Functions

Este documento detalha a implementação da camada de API do Compr.AI usando Vercel Serverless Functions.

---

## 📋 Visão Geral

### Arquitetura

```
Frontend (React)
    ↓ fetch('/api/endpoint')
Vercel Functions (Node.js/TypeScript)
    ↓ SDK queries
Supabase (PostgreSQL + Realtime)
    ↓ API calls
Gemini AI (Google)
```

### Por que Vercel Functions?

- ✅ **Gratuito:** 100GB-hours/mês (suficiente para ~10k usuários)
- ✅ **Sem cold start perceptível:** ~50-200ms vs ~30s do Render
- ✅ **Mesma stack:** TypeScript no frontend e backend
- ✅ **Deploy automático:** Junto com o frontend via Git push
- ✅ **Timeout de 10s:** Suficiente para chamadas Gemini (2-5s médio)

---

## 🗂️ Estrutura de Pastas

```
comprai/
├── api/                        # Vercel Functions
│   ├── suggest-items.ts        # POST /api/suggest-items
│   ├── process-receipt.ts      # POST /api/process-receipt
│   ├── chat.ts                 # POST /api/chat
│   ├── economy-tips.ts         # POST /api/economy-tips
│   ├── normalize-item.ts       # POST /api/normalize-item
│   └── _lib/                   # Código compartilhado
│       ├── supabase.ts         # Cliente Supabase
│       ├── gemini.ts           # Cliente Gemini
│       └── utils.ts            # Utilidades
├── src/                        # Frontend React
└── package.json
```

---

## 🔧 Setup Inicial

### 1. Instalar Dependências

```bash
npm install @vercel/node @google/generative-ai @supabase/supabase-js
```

### 2. Configurar Variáveis de Ambiente

**Criar `.env.local` (para desenvolvimento local):**

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key-aqui

# Gemini AI
GEMINI_API_KEY=sua-gemini-api-key-aqui
```

**Configurar na Vercel (produção):**

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add GEMINI_API_KEY
```

### 3. Criar Código Compartilhado

**`api/_lib/supabase.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js';

export const getSupabaseAdmin = () => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // Service key = acesso admin
    {
      auth: {
        persistSession: false
      }
    }
  );
};
```

**`api/_lib/gemini.ts`:**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getGeminiModel = (modelName: 'gemini-1.5-flash' | 'gemini-1.5-pro' = 'gemini-1.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

// Helper para extrair JSON de respostas Gemini (remove markdown)
export const parseGeminiJSON = (text: string): any => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};
```

**`api/_lib/utils.ts`:**

```typescript
import type { VercelResponse } from '@vercel/node';

// Handler de erros padronizado
export const handleError = (res: VercelResponse, error: unknown) => {
  console.error('[API Error]:', error);

  if (error instanceof Error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }

  return res.status(500).json({
    error: 'Unknown error occurred'
  });
};

// Validação de método HTTP
export const validateMethod = (res: VercelResponse, actualMethod: string, allowedMethods: string[]) => {
  if (!allowedMethods.includes(actualMethod)) {
    res.status(405).json({
      error: 'Method not allowed',
      allowed: allowedMethods
    });
    return false;
  }
  return true;
};
```

---

## 📡 Endpoints da API

### 1. **POST /api/suggest-items** (Release 3)

**Descrição:** Gera sugestões de itens baseadas em histórico e contexto.

**Request Body:**

```typescript
{
  deviceId: string;
  prompt?: string;        // "Preciso fazer lista de churrasco"
  listType?: string;      // "compras gerais", "churrasco", etc
  maxResults?: number;    // Default: 10
}
```

**Response:**

```typescript
{
  items: [
    {
      name: string;       // "Arroz Integral"
      quantity: number;   // 2
      unit: string;       // "kg"
      category: string;   // "Alimentos"
    }
  ]
}
```

**Implementação:**

```typescript
// api/suggest-items.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabase';
import { getGeminiModel, parseGeminiJSON } from './_lib/gemini';
import { handleError, validateMethod } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(res, req.method!, ['POST'])) return;

  try {
    const { deviceId, prompt, listType, maxResults = 10 } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Buscar histórico do usuário
    const supabase = getSupabaseAdmin();
    const { data: history } = await supabase
      .from('purchase_history')
      .select('item_name, category, quantity, unit')
      .eq('device_id', deviceId)
      .order('purchased_at', { ascending: false })
      .limit(50);

    // Criar prompt contextual
    const model = getGeminiModel('gemini-1.5-flash');

    const systemPrompt = `
Você é um assistente inteligente de lista de compras.

Histórico de compras do usuário (últimos itens):
${JSON.stringify(history || [])}

Tarefa: Sugerir ${maxResults} itens para "${listType || 'compras gerais'}".
${prompt ? `Contexto adicional do usuário: "${prompt}"` : ''}

Regras:
- Baseie-se no histórico para sugerir itens que o usuário costuma comprar
- Se não houver histórico, use conhecimento geral
- Organize por categoria (Alimentos, Bebidas, Limpeza, Higiene)
- Use unidades apropriadas (un, kg, L, g, ml)

Retorne APENAS JSON válido (sem markdown):
{
  "items": [
    {
      "name": "Arroz Integral",
      "quantity": 2,
      "unit": "kg",
      "category": "Alimentos"
    }
  ]
}
`;

    const result = await model.generateContent(systemPrompt);
    const suggestions = parseGeminiJSON(result.response.text());

    // Limitar número de resultados
    suggestions.items = suggestions.items.slice(0, maxResults);

    return res.status(200).json(suggestions);
  } catch (error) {
    return handleError(res, error);
  }
}
```

---

### 2. **POST /api/process-receipt** (Release 4)

**Descrição:** Processa texto OCR de nota fiscal e estrutura em JSON.

**Request Body:**

```typescript
{
  deviceId: string;
  ocrText: string;        // Texto bruto extraído por Tesseract.js
}
```

**Response:**

```typescript
{
  store: string;          // "Carrefour"
  date: string;           // "2025-01-15"
  items: [
    {
      name: string;       // "Leite Integral 1L"
      quantity: number;   // 2
      unitPrice: number;  // 5.99
      totalPrice: number; // 11.98
      category: string;   // "Laticínios"
    }
  ],
  total: number;          // 45.87
}
```

**Implementação:**

```typescript
// api/process-receipt.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabase';
import { getGeminiModel, parseGeminiJSON } from './_lib/gemini';
import { handleError, validateMethod } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(res, req.method!, ['POST'])) return;

  try {
    const { deviceId, ocrText } = req.body;

    if (!deviceId || !ocrText) {
      return res.status(400).json({
        error: 'deviceId and ocrText are required'
      });
    }

    // Processar com Gemini Pro (melhor para tarefas complexas)
    const model = getGeminiModel('gemini-1.5-pro');

    const prompt = `
Analise este texto de nota fiscal (cupom de supermercado) e extraia as informações:

---
${ocrText}
---

Tarefa:
1. Identificar nome do estabelecimento
2. Extrair data da compra
3. Listar todos os produtos com quantidade, preço unitário e total
4. Inferir categoria de cada produto (Alimentos, Bebidas, Limpeza, Higiene, etc)
5. Calcular total geral

Retorne APENAS JSON válido (sem markdown):
{
  "store": "Nome do Mercado",
  "date": "2025-01-15",
  "items": [
    {
      "name": "Leite Integral 1L",
      "quantity": 2,
      "unitPrice": 5.99,
      "totalPrice": 11.98,
      "category": "Laticínios"
    }
  ],
  "total": 45.87
}

Se não conseguir identificar alguma informação, use null.
`;

    const result = await model.generateContent(prompt);
    const structured = parseGeminiJSON(result.response.text());

    // Salvar no histórico de preços
    const supabase = getSupabaseAdmin();

    const priceInserts = structured.items.map((item: any) => ({
      device_id: deviceId,
      item_name: item.name,
      price: item.unitPrice,
      store: structured.store,
      purchased_at: structured.date
    }));

    await supabase.from('price_history').insert(priceInserts);

    return res.status(200).json(structured);
  } catch (error) {
    return handleError(res, error);
  }
}
```

---

### 3. **POST /api/chat** (Release 5)

**Descrição:** Chat contextual com IA sobre listas e histórico.

**Request Body:**

```typescript
{
  deviceId: string;
  message: string;                    // "Quanto gastei no mês passado?"
  conversationHistory?: Array<{      // Opcional: histórico da conversa
    role: 'user' | 'model';
    parts: [{ text: string }];
  }>;
}
```

**Response:**

```typescript
{
  response: string;                   // Resposta da IA
}
```

**Implementação:**

```typescript
// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabase';
import { getGeminiModel } from './_lib/gemini';
import { handleError, validateMethod } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(res, req.method!, ['POST'])) return;

  try {
    const { deviceId, message, conversationHistory = [] } = req.body;

    if (!deviceId || !message) {
      return res.status(400).json({
        error: 'deviceId and message are required'
      });
    }

    const supabase = getSupabaseAdmin();

    // Buscar contexto do usuário em paralelo
    const [lists, purchaseHistory, priceHistory] = await Promise.all([
      supabase
        .from('shopping_lists')
        .select('id, name, shopping_items(*)')
        .eq('device_id', deviceId)
        .limit(5),

      supabase
        .from('purchase_history')
        .select('*')
        .eq('device_id', deviceId)
        .order('purchased_at', { ascending: false })
        .limit(100),

      supabase
        .from('price_history')
        .select('*')
        .eq('device_id', deviceId)
        .order('purchased_at', { ascending: false })
        .limit(100)
    ]);

    // Estatísticas rápidas
    const totalLists = lists.data?.length || 0;
    const totalPurchases = purchaseHistory.data?.length || 0;
    const avgSpending = priceHistory.data?.length
      ? (priceHistory.data.reduce((sum, p) => sum + Number(p.price), 0) / priceHistory.data.length).toFixed(2)
      : '0.00';

    // Produtos mais comprados
    const itemCounts: Record<string, number> = {};
    purchaseHistory.data?.forEach(p => {
      itemCounts[p.item_name] = (itemCounts[p.item_name] || 0) + 1;
    });
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Contexto para a IA
    const context = `
Dados do usuário:
- Listas ativas: ${totalLists}
- Total de compras registradas: ${totalPurchases}
- Gasto médio por item: R$ ${avgSpending}
- Produtos mais comprados: ${topItems.join(', ') || 'Nenhum'}

Listas recentes: ${JSON.stringify(lists.data?.map(l => ({ name: l.name, items: l.shopping_items?.length })) || [])}
`;

    const model = getGeminiModel('gemini-1.5-pro');

    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 500
      },
      systemInstruction: `
Você é um assistente de compras inteligente chamado Compr.AI.

Ajude o usuário com perguntas sobre:
- Listas de compras (criar, editar, sugerir itens)
- Histórico de compras
- Análise de gastos
- Dicas de economia
- Comparação de preços

${context}

Seja conciso, amigável e útil. Use o histórico e contexto para dar respostas personalizadas.
`
    });

    const result = await chat.sendMessage(message);

    return res.status(200).json({
      response: result.response.text()
    });
  } catch (error) {
    return handleError(res, error);
  }
}
```

---

### 4. **POST /api/economy-tips** (Release 5)

**Descrição:** Gera dicas de economia baseadas em histórico de preços.

**Request Body:**

```typescript
{
  deviceId: string;
  listId: string;         // ID da lista para analisar
}
```

**Response:**

```typescript
{
  tips: string;           // Texto markdown com dicas
}
```

**Implementação:**

```typescript
// api/economy-tips.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabase';
import { getGeminiModel } from './_lib/gemini';
import { handleError, validateMethod } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(res, req.method!, ['POST'])) return;

  try {
    const { deviceId, listId } = req.body;

    if (!deviceId || !listId) {
      return res.status(400).json({
        error: 'deviceId and listId are required'
      });
    }

    const supabase = getSupabaseAdmin();

    // Buscar itens da lista
    const { data: items } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('list_id', listId);

    // Buscar histórico de preços dos itens
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('*')
      .eq('device_id', deviceId)
      .order('purchased_at', { ascending: false })
      .limit(200);

    const model = getGeminiModel('gemini-1.5-pro');

    const prompt = `
Analise a lista de compras e o histórico de preços do usuário.

Lista atual:
${JSON.stringify(items)}

Histórico de preços:
${JSON.stringify(priceHistory)}

Tarefa: Gere 3-5 dicas de economia específicas e acionáveis.

Exemplo de dica:
- **Leite Integral 1L**: Você costuma pagar R$ 6,50 no Carrefour. No Extra custa R$ 5,80 (economize 11%)
- **Arroz 5kg**: Preço aumentou 15% no último mês. Considere comprar em maior quantidade quando estiver em promoção.

Retorne as dicas em formato markdown.
`;

    const result = await model.generateContent(prompt);

    return res.status(200).json({
      tips: result.response.text()
    });
  } catch (error) {
    return handleError(res, error);
  }
}
```

---

### 5. **POST /api/normalize-item** (Release 3)

**Descrição:** Normaliza nomes de produtos (padronização).

**Request Body:**

```typescript
{
  rawName: string;        // "leite integral itambé 1l"
}
```

**Response:**

```typescript
{
  normalized: string;     // "Leite Integral 1L"
}
```

**Implementação:**

```typescript
// api/normalize-item.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiModel } from './_lib/gemini';
import { handleError, validateMethod } from './_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateMethod(res, req.method!, ['POST'])) return;

  try {
    const { rawName } = req.body;

    if (!rawName) {
      return res.status(400).json({ error: 'rawName is required' });
    }

    const model = getGeminiModel('gemini-1.5-flash');

    const result = await model.generateContent(`
Normalize o nome deste produto para um formato padrão:
"${rawName}"

Regras:
- Capitalize primeira letra de cada palavra importante
- Remova marcas específicas se houver genérico óbvio
- Mantenha unidades (1L, 500g, etc) no final
- Mantenha conciso

Exemplos:
- "leite integral itambé 1l" → "Leite Integral 1L"
- "ARROZ TIPO 1 5KG" → "Arroz Tipo 1 5kg"
- "sabao em po omo 1kg" → "Sabão em Pó 1kg"

Retorne APENAS o nome normalizado, sem explicações.
`);

    return res.status(200).json({
      normalized: result.response.text().trim()
    });
  } catch (error) {
    return handleError(res, error);
  }
}
```

---

## 🧪 Testando Localmente

### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2. Rodar localmente

```bash
# Na raiz do projeto
vercel dev
```

Isso:
- Roda o frontend na porta 3000
- Roda as Vercel Functions em `/api/*`
- Carrega variáveis de `.env.local`

### 3. Testar endpoints

```bash
# Testar suggest-items
curl -X POST http://localhost:3000/api/suggest-items \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-123", "prompt": "lista de churrasco"}'

# Testar normalize-item
curl -X POST http://localhost:3000/api/normalize-item \
  -H "Content-Type: application/json" \
  -d '{"rawName": "leite integral 1l"}'
```

---

## 🚀 Deploy

```bash
# Deploy de preview (desenvolvimento)
vercel

# Deploy de produção
vercel --prod
```

As Vercel Functions são automaticamente deployadas junto com o frontend.

---

## 📊 Monitoramento

### Logs na Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Functions**
4. Clique em qualquer função para ver logs em tempo real

### Limites e Performance

**Tier Gratuito:**
- 100GB-hours de execução/mês
- Timeout: 10s por invocação
- 100GB de bandwidth

**Otimizações:**
- Use Gemini Flash para operações rápidas (< 2s)
- Use Gemini Pro apenas para OCR e chat (pode levar 5-8s)
- Cache respostas frequentes no frontend (IndexedDB)

---

## 🔐 Segurança

### Proteções Implementadas

1. **Validação de método HTTP**
2. **Validação de parâmetros obrigatórios**
3. **Uso de service_role key apenas no backend** (nunca expor no frontend)
4. **CORS configurado automaticamente pela Vercel**
5. **Rate limiting automático pela Vercel**

### Boas Práticas

```typescript
// ✅ BOM - Validar inputs
if (!deviceId || typeof deviceId !== 'string') {
  return res.status(400).json({ error: 'Invalid deviceId' });
}

// ✅ BOM - Usar try/catch
try {
  // código
} catch (error) {
  return handleError(res, error);
}

// ❌ EVITAR - Expor detalhes internos
return res.status(500).json({
  error: error.stack // Nunca expor stack trace
});
```

---

## 📚 Recursos

- **Vercel Functions Docs:** https://vercel.com/docs/functions
- **Gemini Node.js SDK:** https://ai.google.dev/gemini-api/docs/get-started/node
- **Supabase Client:** https://supabase.com/docs/reference/javascript/introduction

---

**Última atualização:** 2025-11-12
