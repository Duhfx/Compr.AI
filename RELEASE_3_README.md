# 🧠 Release 3 — Inteligência de Sugestões

**Status:** ✅ Concluído
**Data:** 2025-11-12

---

## 📋 Visão Geral

A Release 3 adiciona inteligência artificial ao Compr.AI, transformando-o de uma simples lista de compras em um assistente inteligente que aprende com seus hábitos de compra e oferece sugestões contextuais.

### 🎯 Objetivos Alcançados

- ✅ Histórico de compras automático
- ✅ Sugestões de IA baseadas em histórico
- ✅ Autocompletar inteligente
- ✅ Criar lista com IA usando texto livre
- ✅ Normalização automática de nomes de produtos

---

## 🆕 Features Implementadas

### 1. Histórico de Compras Automático

**Arquivos:**
- `supabase/migrations/003_history.sql`

**Como funciona:**
- Quando um item é marcado como comprado (`checked = true`), um trigger SQL automaticamente registra a compra no histórico
- O histórico inclui: nome do produto, categoria, quantidade, unidade e data
- Dados são armazenados tanto localmente (IndexedDB) quanto no Supabase

**Exemplo de uso:**
```typescript
// Automático - ao marcar item como comprado
await toggleItem(itemId); // Trigger SQL registra no histórico
```

### 2. Sugestões de IA

**Arquivos:**
- `api/suggest-items.ts` (Vercel Function)
- `src/hooks/useSuggestions.ts`
- `src/services/api.ts`

**Como funciona:**
1. Busca os 50 produtos mais comprados pelo usuário
2. Envia para o Gemini AI junto com o contexto (tipo de lista, prompt do usuário)
3. IA retorna sugestões personalizadas em formato JSON
4. Sugestões são mescladas com histórico local para resultados mais rápidos

**Exemplo de uso:**
```typescript
const { suggestions, loading, getSuggestions } = useSuggestions();

// Buscar sugestões
await getSuggestions('arr'); // Retorna: ["Arroz Integral 2kg", "Arroz Branco 5kg", ...]
```

### 3. Autocompletar Inteligente

**Arquivos:**
- `src/components/items/ItemInput.tsx`

**Como funciona:**
- Input de item com debounce de 300ms
- Busca primeiro no histórico local (rápido, offline)
- Se não houver resultados suficientes, consulta a IA
- Exibe sugestões com ícones diferenciados (histórico vs IA)
- Navegação por teclado (↑↓ para navegar, Enter para selecionar)

**Recursos:**
- 🔵 Ícone de relógio = Sugestão do histórico
- 🟣 Ícone de estrela = Sugestão da IA
- Mostra categoria e unidade sugeridas
- Funciona offline (usando apenas histórico local)

### 4. Criar Lista com IA

**Arquivos:**
- `src/components/lists/CreateListWithAIModal.tsx`
- `src/hooks/useSuggestions.ts` (hook `useCreateListWithAI`)
- `src/pages/Home.tsx` (integração)

**Como funciona:**
1. Usuário clica no botão "Com IA" na home
2. Descreve a lista em texto livre (ex: "Lista para churrasco no fim de semana")
3. IA analisa o pedido e retorna itens completos (nome, quantidade, unidade, categoria)
4. Lista é criada automaticamente no IndexedDB
5. Usuário é redirecionado para a lista criada

**Exemplos de prompts:**
- "Lista para churrasco no fim de semana"
- "Café da manhã saudável para a semana"
- "Ingredientes para fazer lasanha"
- "Compras do mês"

### 5. Normalização de Nomes

**Arquivos:**
- `api/normalize-item.ts` (Vercel Function)
- `src/hooks/useLocalItems.ts` (método `createItemWithNormalization`)

**Como funciona:**
- IA normaliza nomes de produtos para manter consistência
- Remove caracteres especiais, padroniza maiúsculas/minúsculas
- Detecta e sugere categoria e unidade automaticamente
- Cache local para evitar chamadas repetidas à API

**Exemplo:**
```
Input:  "leite integral itambé"
Output: "Leite Integral 1L"
Category: "Alimentos"
Unit: "L"

Input:  "ARROZ TIPO 1 5KG"
Output: "Arroz Tipo 1 5kg"
Category: "Alimentos"
Unit: "kg"
```

---

## 🗂️ Estrutura de Arquivos Adicionados

```
comprai/
├── api/
│   ├── suggest-items.ts           ✨ Sugestões de IA
│   └── normalize-item.ts          ✨ Normalização de nomes
├── src/
│   ├── components/
│   │   ├── items/
│   │   │   └── ItemInput.tsx      ✨ Input com autocomplete
│   │   └── lists/
│   │       └── CreateListWithAIModal.tsx  ✨ Modal criar lista com IA
│   ├── hooks/
│   │   └── useSuggestions.ts      ✨ Hook de sugestões + criar lista IA
│   ├── services/
│   │   └── api.ts                 ✨ Cliente API para Vercel Functions
│   └── pages/
│       └── Home.tsx               🔄 Atualizado (botão "Com IA")
├── supabase/migrations/
│   ├── 003_history.sql            ✨ Histórico de compras + trigger
│   └── 004_price_history.sql      ✨ Histórico de preços (prep. Release 4)
└── RELEASE_3_README.md            ✨ Este arquivo
```

**Legenda:**
- ✨ = Arquivo novo
- 🔄 = Arquivo modificado

---

## 🔧 Setup e Configuração

### 1. Aplicar Migrations no Supabase

```bash
# Aplicar migration de histórico
supabase db push

# Ou executar manualmente no SQL Editor do Supabase
# Copiar conteúdo de:
# - supabase/migrations/003_history.sql
# - supabase/migrations/004_price_history.sql
```

### 2. Configurar Variáveis de Ambiente

Adicione a chave da API do Gemini nas variáveis de ambiente da Vercel:

```bash
# Via CLI
vercel env add GEMINI_API_KEY

# Ou via Dashboard Vercel:
# Settings > Environment Variables > Add
# Name: GEMINI_API_KEY
# Value: sua-api-key-aqui
```

**Como obter a API key do Gemini:**
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API key"
3. Copie a chave gerada

### 3. Instalar Dependências

```bash
# Já incluídas no package.json, mas caso precise:
npm install @google/generative-ai
```

### 4. Deploy

```bash
# Deploy de desenvolvimento (testa as Vercel Functions)
vercel

# Deploy de produção
vercel --prod
```

---

## 🧪 Como Testar

### Teste 1: Autocompletar

1. Abra qualquer lista
2. Clique no input "Adicionar item..."
3. Digite pelo menos 2 caracteres (ex: "arr")
4. Aguarde sugestões aparecerem
5. Navegue com ↑↓ e selecione com Enter

**Resultado esperado:**
- Sugestões aparecem em ~300ms
- Ícones diferentes para histórico vs IA
- Categoria e unidade exibidas
- Seleção adiciona item à lista

### Teste 2: Criar Lista com IA

1. Na home, clique no botão "Com IA" (roxo com estrela)
2. Digite: "Lista para churrasco"
3. Clique "Criar Lista"
4. Aguarde processamento (~2-3 segundos)

**Resultado esperado:**
- Lista criada com nome "Lista para churrasco"
- Itens sugeridos: carne, carvão, sal grosso, linguiça, pão de alho, etc.
- Redirecionamento automático para a lista
- Quantidades e unidades apropriadas

### Teste 3: Histórico de Compras

1. Abra uma lista com itens
2. Marque alguns itens como comprados
3. Abra DevTools > Application > IndexedDB > CompraiDB > purchaseHistory
4. Verifique se os itens marcados foram registrados

**Resultado esperado:**
- Cada item marcado gera entrada no histórico
- Campos preenchidos: itemName, category, quantity, unit, purchasedAt

### Teste 4: Normalização (opcional, API cara)

1. Crie um item com nome despadronizado: "leite integral"
2. Use `createItemWithNormalization` em vez de `createItem`
3. Verifique se o nome foi normalizado para "Leite Integral 1L"

**Nota:** Para economizar chamadas de API, a normalização é opcional e não está ativa por padrão no ItemInput.

---

## 📊 Limites e Custos

### Gemini AI (Tier Gratuito)

| Modelo | Limite | Uso |
|--------|--------|-----|
| **Gemini 1.5 Flash** | 15 req/min | Sugestões, normalização |
| **Gemini 1.5 Pro** | 2 req/min | Análise complexa (futuro) |

### Vercel Functions

| Recurso | Limite Gratuito |
|---------|-----------------|
| Execução | 100 GB-hours/mês |
| Timeout | 10s por função |
| Memória | 1024 MB |

### Estratégias de Otimização

1. **Cache local**: Sugestões são primeiro buscadas no IndexedDB
2. **Debounce**: Input espera 300ms antes de chamar API
3. **Limite de resultados**: Máximo 5 sugestões por vez
4. **Cache de normalização**: Nomes normalizados ficam em memória

**Estimativa de uso mensal (1000 usuários):**
- ~500-1000 requisições/dia para sugestões
- ~50-100 requisições/dia para criar lista com IA
- **Total**: Bem abaixo do limite gratuito

---

## 🐛 Troubleshooting

### Problema 1: Sugestões não aparecem

**Possíveis causas:**
- API key do Gemini não configurada
- Vercel Function não deployada
- Erro de CORS

**Solução:**
```bash
# Verificar logs da Vercel Function
vercel logs

# Verificar variáveis de ambiente
vercel env ls

# Redeployar
vercel --prod
```

### Problema 2: Trigger de histórico não funciona

**Possíveis causas:**
- Migration não aplicada no Supabase
- RLS bloqueando inserções

**Solução:**
```sql
-- Verificar se trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_log_purchase';

-- Verificar se função existe
SELECT * FROM pg_proc WHERE proname = 'log_purchase';

-- Recriar se necessário
-- (copiar conteúdo de 003_history.sql)
```

### Problema 3: Modal de IA não abre

**Possíveis causas:**
- Erro de import
- Estado React não atualizado

**Solução:**
```typescript
// Verificar import em Home.tsx
import { CreateListWithAIModal } from '../components/lists/CreateListWithAIModal';

// Verificar estado
const [showAIModal, setShowAIModal] = useState(false);

// Verificar botão
<button onClick={() => setShowAIModal(true)}>
```

---

## 🔮 Próximos Passos (Release 4)

- [ ] OCR de notas fiscais com Tesseract.js
- [ ] Estruturação de dados com Gemini Pro
- [ ] Histórico de preços com variação temporal
- [ ] Sugestões baseadas em melhor preço

---

## 📚 Referências

- **Gemini AI Docs**: https://ai.google.dev/gemini-api/docs
- **Vercel Functions**: https://vercel.com/docs/functions
- **Dexie.js**: https://dexie.org
- **Supabase Triggers**: https://supabase.com/docs/guides/database/postgres/triggers

---

**Desenvolvido com IA 🤖 | Compr.AI v0.3.0**
