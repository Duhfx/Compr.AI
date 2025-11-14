# 🧠 Sugestões com IA

## Visão Geral

Sistema de sugestões inteligentes usando Google Gemini AI para gerar listas de compras personalizadas baseadas no histórico do usuário.

---

## Implementação v1.5.0

**Data de Implementação:** Novembro/2025
**Status:** ✅ Implementado
**API:** Google Gemini 1.5 Flash

### Arquitetura

```
┌──────────────┐
│   Frontend   │
│   (Modal)    │
└──────┬───────┘
       │ POST /api/suggest-items
       │ { userId, prompt, listType }
       ▼
┌──────────────┐
│  Vercel      │
│  Function    │
└──────┬───────┘
       │
       ├──► Supabase (histórico)
       │
       └──► Gemini AI (sugestões)
              │
              ▼
         JSON de itens
```

### API Endpoint

**Arquivo:** `api/suggest-items.ts`

#### Request

```typescript
POST /api/suggest-items

Body:
{
  userId: string,        // user.id do Supabase
  prompt?: string,       // Contexto adicional (ex: "churrasco")
  listType?: string,     // Tipo de lista (ex: "feira")
  maxItems?: number      // Máximo de itens (padrão: 15)
}
```

#### Response

```typescript
{
  items: [
    {
      name: string,
      quantity: number,
      unit: string,
      category: string
    }
  ]
}
```

### Implementação Backend

```typescript
// api/suggest-items.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, prompt, listType, maxItems = 15 } = req.body;

    // 1. Buscar histórico do usuário
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: history } = await supabase
      .from('purchase_history')
      .select('item_name, category, quantity, unit')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
      .limit(50);

    // 2. Construir prompt para Gemini
    const systemPrompt = buildSystemPrompt(history, prompt, listType, maxItems);

    // 3. Chamar Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    // 4. Parse JSON
    const cleanText = text.replace(/```json|```/g, '').trim();
    const suggestions = JSON.parse(cleanText);

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

### Prompt Engineering

#### System Prompt Completo

```typescript
const buildSystemPrompt = (
  history: any[],
  userPrompt?: string,
  listType?: string,
  maxItems: number = 15
) => {
  return `
Você é um assistente inteligente de listas de compras.

# HISTÓRICO DO USUÁRIO
${JSON.stringify(history, null, 2)}

# TAREFA
Sugira ${maxItems} itens para uma lista de compras.

${listType ? `TIPO DE LISTA: ${listType}` : ''}
${userPrompt ? `CONTEXTO ADICIONAL: ${userPrompt}` : ''}

# REGRAS
1. Use o histórico para personalizar sugestões
2. Agrupe por categorias (Alimentos, Bebidas, Higiene, Limpeza, Outros)
3. Quantidades realistas (ex: 2kg arroz, 1L leite)
4. Unidades padronizadas (kg, g, L, ml, un)
5. Priorize itens comprados recentemente
6. Se o usuário mencionou contexto (ex: "churrasco"), adapte a lista

# FORMATO DE SAÍDA (JSON VÁLIDO)
{
  "items": [
    {
      "name": "Arroz integral",
      "quantity": 2,
      "unit": "kg",
      "category": "Alimentos"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem markdown ou explicações.
`.trim();
};
```

#### Exemplos de Prompts

| User Input | List Type | Resultado |
|------------|-----------|-----------|
| "churrasco" | - | Carne, carvão, sal grosso, cerveja |
| "jantar romântico" | - | Vinho, massa, molho, velas |
| - | "feira" | Frutas, verduras, legumes |
| "festa infantil" | - | Salgadinhos, refrigerante, doces |

### Implementação Frontend

#### Hook `useSuggestions`

```typescript
// src/hooks/useSuggestions.ts
export const useSuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const getSuggestions = async (
    prompt?: string,
    listType?: string
  ): Promise<SuggestedItem[]> => {
    if (!user) throw new Error('Usuário não autenticado');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/suggest-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          prompt,
          listType
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao obter sugestões');
      }

      const data = await response.json();
      return data.items;

    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { getSuggestions, loading, error };
};
```

#### Modal de Criação com IA

```typescript
// src/components/lists/CreateListModal.tsx
const CreateListModal: React.FC = () => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [prompt, setPrompt] = useState('');
  const { getSuggestions, loading } = useSuggestions();

  const handleAICreate = async () => {
    try {
      // 1. Obter sugestões
      const suggestions = await getSuggestions(prompt);

      // 2. Criar lista
      const newList = await createList(listName);

      // 3. Adicionar itens em lote
      await Promise.all(
        suggestions.map(item =>
          addItem(newList.id, {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category
          })
        )
      );

      // 4. Navegar para lista
      navigate(`/list/${newList.id}`);
      toast.success(`Lista criada com ${suggestions.length} itens!`);

    } catch (error) {
      toast.error('Erro ao criar lista com IA');
    }
  };

  return (
    <Dialog>
      {/* Modo Manual */}
      {mode === 'manual' && (
        <input
          placeholder="Nome da lista"
          onChange={(e) => setListName(e.target.value)}
        />
      )}

      {/* Modo IA */}
      {mode === 'ai' && (
        <>
          <input
            placeholder="Ex: churrasco, festa, jantar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button onClick={handleAICreate} disabled={loading}>
            {loading ? 'Gerando...' : 'Criar com IA'}
          </button>
        </>
      )}
    </Dialog>
  );
};
```

### Otimizações

#### 1. Cache de Sugestões

```typescript
// Cache de 5 minutos
const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

const getCached = (key: string) => {
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};
```

#### 2. Debounce de Input

```typescript
const [debouncedPrompt] = useDebounce(prompt, 500);

useEffect(() => {
  if (debouncedPrompt.length > 3) {
    getSuggestions(debouncedPrompt);
  }
}, [debouncedPrompt]);
```

#### 3. Rate Limiting

```typescript
// Backend: Limitar a 10 requisições por minuto por usuário
const rateLimitMap = new Map<string, number[]>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];

  // Remove requisições antigas (> 1 minuto)
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < 60000
  );

  if (recentRequests.length >= 10) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
};
```

### Categorização Automática

#### Categorias Padrão

```typescript
const CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Higiene Pessoal',
  'Limpeza',
  'Pet',
  'Outros'
];
```

#### Lógica de Categorização

```typescript
// Gemini categoriza automaticamente, mas podemos validar
const normalizeCategory = (category: string): string => {
  const mapping: Record<string, string> = {
    'comida': 'Alimentos',
    'food': 'Alimentos',
    'bebida': 'Bebidas',
    'drink': 'Bebidas',
    'higiene': 'Higiene Pessoal',
    'limpeza': 'Limpeza',
    'cleaning': 'Limpeza'
  };

  return mapping[category.toLowerCase()] || 'Outros';
};
```

### Unidades Padronizadas

```typescript
const UNITS = ['kg', 'g', 'L', 'ml', 'un', 'cx', 'pct'];

const normalizeUnit = (unit: string): string => {
  const mapping: Record<string, string> = {
    'quilos': 'kg',
    'gramas': 'g',
    'litros': 'L',
    'mililitros': 'ml',
    'unidades': 'un',
    'unidade': 'un',
    'caixas': 'cx',
    'pacotes': 'pct'
  };

  return mapping[unit.toLowerCase()] || unit;
};
```

### Custos e Rate Limits

#### Google Gemini 1.5 Flash

- **Modelo:** `gemini-1.5-flash`
- **Preço:** Grátis até 15 req/min
- **Limite:** 1M tokens/mês (free tier)
- **Latência:** ~1-2s

#### Estimativa de Custo

```
Sugestão média:
- Input: ~500 tokens (histórico)
- Output: ~200 tokens (15 itens)
- Total: ~700 tokens/requisição

1M tokens/mês ÷ 700 = ~1.400 sugestões/mês (grátis)
```

### Tratamento de Erros

#### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Invalid API key` | Chave Gemini inválida | Verificar `.env` |
| `Rate limit exceeded` | Muitas requisições | Implementar debounce |
| `Invalid JSON` | Gemini retornou markdown | Regex para limpar |
| `Network error` | Timeout | Retry com backoff |

**Código:**
```typescript
try {
  const result = await model.generateContent(systemPrompt);
  const text = result.response.text();

  // Limpa markdown se presente
  const cleanText = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const suggestions = JSON.parse(cleanText);

} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Invalid JSON from Gemini:', error);
    return fallbackSuggestions(); // Sugestões genéricas
  }
  throw error;
}
```

### Melhorias Futuras

- [ ] **Feedback Loop:** Aprender com itens aceitos/rejeitados
- [ ] **Contexto Sazonal:** Sugestões baseadas em época do ano
- [ ] **Nutrição:** Sugerir alternativas saudáveis
- [ ] **Preço:** Considerar histórico de preços
- [ ] **Loja:** Adaptar sugestões por supermercado

---

**Última atualização:** 14/11/2025
**Versão:** 1.5.0
**Modelo:** Google Gemini 1.5 Flash
