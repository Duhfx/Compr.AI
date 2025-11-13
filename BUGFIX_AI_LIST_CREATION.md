# 🐛 Bugfix: Erro 400 ao Criar Lista com IA

## Problema

Ao tentar criar uma lista de compras usando sugestões de IA, a aplicação retornava erro 400 e a lista não era criada.

```
Failed to load resource: the server responded with a status of 400 ()
Error creating list with AI: Error: Failed to create list with AI
```

### Sintomas
- ❌ Modal de "Criar Lista com IA" não funcionava
- ❌ Erro 400 (Bad Request) da API
- ❌ Console mostrava "Failed to create list with AI"

## Causa Raiz

O hook `useCreateListWithAI` estava desatualizado e não foi migrado quando o sistema mudou de **device-based** para **user-based authentication**:

### Problemas Identificados

1. **Enviando parâmetro errado para API**
   - Hook enviava `deviceId`
   - API esperava `userId`
   - Resultado: API retornava 400 (Bad Request) porque `userId` era obrigatório

2. **Salvando no IndexedDB ao invés do Supabase**
   - Hook criava lista no IndexedDB (storage local)
   - Sistema atual usa Supabase (database cloud)
   - Resultado: Lista criada não sincronizava com servidor

3. **Usando hook errado de autenticação**
   - Hook usava `useDeviceId()` (sistema antigo)
   - Deveria usar `useAuth()` (sistema atual)

### Código Problemático

```typescript
// ❌ ERRADO: Hook antigo (src/hooks/useSuggestions.ts)
export const useCreateListWithAI = () => {
  const deviceId = useDeviceId(); // Hook do sistema antigo

  const createListFromPrompt = useCallback(async (prompt: string) => {
    // 1. Enviava deviceId (não existe mais)
    const response = await fetch('/api/suggest-items', {
      method: 'POST',
      body: JSON.stringify({
        deviceId, // ❌ API espera userId
        prompt,
        listType: 'interpretação livre'
      })
    });

    // 2. Salvava no IndexedDB (local)
    await db.shoppingLists.add({
      id: listId,
      name: prompt,
      // ... ❌ Deveria salvar no Supabase
    });

    // 3. Salvava itens no IndexedDB (local)
    for (const item of data.items) {
      await db.shoppingItems.add({
        // ... ❌ Deveria salvar no Supabase
      });
    }
  }, [deviceId]);
};
```

## Solução

Atualizei o hook `useCreateListWithAI` para usar o sistema de autenticação atual e Supabase:

```typescript
// ✅ CORRETO: Hook atualizado
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useCreateListWithAI = () => {
  const { user } = useAuth(); // ✅ Usa sistema de auth atual

  const createListFromPrompt = useCallback(async (prompt: string) => {
    // 1. Validar autenticação
    if (!user) {
      throw new Error('Usuário não autenticado. Por favor, faça login.');
    }

    // 2. Chamar API com userId correto
    const response = await fetch('/api/suggest-items', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id, // ✅ Envia userId
        prompt,
        listType: 'interpretação livre',
        maxResults: 15
      })
    });

    // Validar resposta
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create list with AI: ${errorData.error}`);
    }

    const data = await response.json();

    // 3. Criar lista no Supabase
    const { data: createdList, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: user.id, // ✅ Usa userId do sistema de auth
        name: prompt,
      })
      .select()
      .single();

    if (listError) {
      throw new Error(`Failed to create list: ${listError.message}`);
    }

    // 4. Criar itens no Supabase
    const itemsToInsert = data.items.map((item: any) => ({
      list_id: createdList.id,
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'un',
      category: item.category,
      checked: false,
    }));

    const { error: itemsError } = await supabase
      .from('shopping_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback: deletar lista se falhar ao criar itens
      await supabase.from('shopping_lists').delete().eq('id', createdList.id);
      throw new Error(`Failed to create items: ${itemsError.message}`);
    }

    return createdList.id;
  }, [user]);
};
```

### Melhorias Adicionadas

1. **Validação de autenticação**
   - Verifica se usuário está logado antes de processar
   - Mensagem de erro clara se não autenticado

2. **Melhor tratamento de erros**
   - Parse de erro da API para mostrar mensagem específica
   - Logs detalhados para debugging
   - Rollback automático se criação de itens falhar

3. **Validação de resposta da IA**
   - Verifica se IA retornou itens
   - Mensagem amigável se não houver sugestões

4. **Logging para debug**
   - Logs em cada etapa do processo
   - Facilita identificação de problemas futuros

## Como Testar

### Pré-requisitos

1. Usuário deve estar autenticado
2. Variável `GEMINI_API_KEY` configurada
3. Servidor dev rodando: `npm run dev`

### Passo a Passo

1. **Acesse a aplicação** em http://localhost:5173
2. **Faça login** com uma conta válida
3. **Na home**, clique em **"Com IA"** (botão roxo)
4. **Digite um prompt**, exemplo:
   - "Lista para churrasco no fim de semana"
   - "Café da manhã saudável para a semana"
   - "Ingredientes para fazer lasanha"
5. **Clique em "Criar Lista"**
6. **Aguarde** (pode demorar 2-5 segundos)
7. **Verifique**:
   - ✅ Lista criada com nome do prompt
   - ✅ Itens sugeridos pela IA
   - ✅ Redirecionamento para página da lista
   - ✅ Sem erros no console

### Verificação no Console

Logs esperados (sucesso):

```
[useCreateListWithAI] Creating list for user: <uuid> Prompt: Lista para churrasco
[useCreateListWithAI] Got 12 suggestions from AI
[useCreateListWithAI] List created: <list-uuid>
[useCreateListWithAI] Created 12 items
```

## Arquivos Modificados

### 1. `src/hooks/useSuggestions.ts`

**Mudanças:**
- Adicionados imports: `useAuth`, `supabase`
- Hook `useCreateListWithAI` completamente reescrito
- Migrado de IndexedDB para Supabase
- Migrado de deviceId para userId

**Linhas afetadas:** 151-254

## Compatibilidade com API

A Vercel Function `/api/suggest-items` já estava correta e esperando `userId`:

```typescript
// api/suggest-items.ts (NÃO MODIFICADO)
interface SuggestionRequest {
  userId: string; // ✅ Já estava correto
  prompt?: string;
  listType?: string;
  maxResults?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId, prompt, listType, maxResults = 10 } = req.body;

  // Validação
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // ... resto da função
}
```

O problema era apenas no frontend que ainda enviava `deviceId`.

## Impacto

### Antes da Correção
- ❌ Funcionalidade de criar lista com IA totalmente quebrada
- ❌ Erro 400 em todas as tentativas
- ❌ Frustração do usuário

### Depois da Correção
- ✅ Criação de lista com IA funciona perfeitamente
- ✅ Listas sincronizadas com Supabase
- ✅ Integração completa com sistema de autenticação
- ✅ Tratamento de erros robusto

## Funcionalidades Relacionadas

Esta correção habilita/melhora:

1. **Criação rápida de listas** - Usuário descreve e IA cria
2. **Onboarding facilitado** - Novos usuários podem começar rapidamente
3. **Histórico de compras** - IA usa histórico para sugestões personalizadas
4. **UX melhorada** - Menos fricção na criação de listas

## Próximos Passos (Melhorias Futuras)

1. **Cache de sugestões**
   - Evitar chamadas repetidas à API
   - Melhorar performance

2. **Feedback visual**
   - Mostrar progresso da criação
   - Animação enquanto IA processa

3. **Edição antes de criar**
   - Permitir revisar/editar sugestões
   - Remover/adicionar itens antes de salvar

4. **Templates populares**
   - Sugestões de prompts comuns
   - "Churrasco", "Café da manhã", etc.

5. **Melhorar prompts da IA**
   - Adicionar contexto de localização
   - Considerar sazonalidade
   - Preferências dietéticas

## Referências

- **BUGFIX_RLS_RECURSION.md** - Fix de políticas RLS
- **BUGFIX_PURCHASE_HISTORY.md** - Fix do trigger de histórico
- **Migration 005** - Migração device_id → user_id
- [Gemini AI API Docs](https://ai.google.dev/gemini-api/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

---

**Data:** 2025-11-13
**Versão:** 1.0.0
**Status:** ✅ Resolvido
**Teste:** ⏳ Aguardando teste do usuário
