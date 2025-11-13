# 🐛 Bugfix: Recursão Infinita nas Políticas RLS

## Problema

Ao tentar carregar ou criar listas de compras, a aplicação retornava o seguinte erro:

```
infinite recursion detected in policy for relation "shopping_lists"
```

### Sintomas
- ❌ Não conseguia carregar listas existentes
- ❌ Não conseguia criar novas listas
- ❌ Erro 42P17 do PostgreSQL

## Causa Raiz

As políticas RLS (Row Level Security) estavam causando recursão infinita porque:

**Problema:** Uma política RLS em `shopping_lists` tentava fazer SELECT na própria tabela `shopping_lists`.

### Exemplo do Código Problemático

```sql
-- ❌ ERRADO: Causa recursão infinita
CREATE POLICY "select_own_and_shared_lists"
  ON shopping_lists FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    id IN (
      SELECT list_id FROM list_members  -- OK
      WHERE user_id = auth.uid()
    )
  );

-- Quando você faz SELECT em shopping_lists:
-- 1. PostgreSQL verifica a política RLS
-- 2. A política tenta fazer SELECT em shopping_lists (linha 45)
-- 3. Para fazer esse SELECT, verifica a política RLS novamente
-- 4. Loop infinito! 🔄
```

### Por Que Acontece?

Quando você referencia a mesma tabela dentro da política RLS dessa tabela, o PostgreSQL precisa verificar a política para executar a query, que por sua vez precisa verificar a política novamente, criando um loop infinito.

## Solução

Criamos **funções SECURITY DEFINER** que quebram a cadeia de recursão:

### Funções Helper

```sql
-- ✅ CORRETO: SECURITY DEFINER bypassa RLS
CREATE OR REPLACE FUNCTION user_can_access_list(check_list_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- ⭐ Chave: executa com privilégios do owner
STABLE
AS $$
BEGIN
  -- Esta função roda FORA do contexto de RLS
  RETURN EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE id = check_list_id AND user_id = check_user_id
  ) OR EXISTS (
    SELECT 1 FROM list_members
    WHERE list_id = check_list_id
      AND user_id = check_user_id
      AND is_active = true
  );
END;
$$;
```

### Nova Política (Sem Recursão)

```sql
-- ✅ CORRETO: Usa função helper
CREATE POLICY "shopping_items_select"
  ON shopping_items FOR SELECT
  USING (user_can_access_list(list_id, auth.uid()));
```

## Como Aplicar a Correção

### Passo 1: Abrir Supabase SQL Editor

Acesse: https://supabase.com/dashboard/project/abcqyslruytnplsecgvv/sql

### Passo 2: Executar Migration

1. Abra o arquivo `APPLY_MIGRATION_007.sql` na raiz do projeto
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou Ctrl+Enter)

### Passo 3: Verificar Sucesso

Se não houver erros, você verá:

```
Success. No rows returned
```

### Passo 4: Testar a Aplicação

1. Recarregue a página da aplicação
2. Tente carregar listas existentes
3. Tente criar uma nova lista

## Estrutura da Solução

### Funções Helper Criadas

1. **`user_can_access_list(list_id, user_id)`**
   - Retorna `true` se o usuário pode ver a lista
   - Verifica: É dono OU é membro ativo

2. **`user_can_edit_list(list_id, user_id)`**
   - Retorna `true` se o usuário pode editar a lista
   - Verifica: É dono OU (é membro E lista tem permissão 'edit')

### Políticas RLS Reescritas

#### Shopping Lists
- `shopping_lists_select` - Ver próprias listas + listas compartilhadas
- `shopping_lists_insert` - Criar apenas próprias listas
- `shopping_lists_update` - Editar próprias + compartilhadas com permissão
- `shopping_lists_delete` - Deletar apenas próprias

#### Shopping Items
- `shopping_items_select` - Ver itens de listas acessíveis
- `shopping_items_insert` - Criar itens em listas editáveis
- `shopping_items_update` - Editar itens de listas editáveis
- `shopping_items_delete` - Deletar itens de listas editáveis

#### Shared Lists
- `shared_lists_select` - Qualquer um pode ver (necessário para join por código)
- `shared_lists_insert` - Apenas donos criam links de compartilhamento
- `shared_lists_update` - Apenas donos atualizam
- `shared_lists_delete` - Apenas donos deletam

#### List Members
- `list_members_select` - Ver membros de listas acessíveis
- `list_members_insert` - Usuários podem se adicionar
- `list_members_update` - Apenas donos atualizam membros
- `list_members_delete` - Apenas donos removem membros

## Prevenção Futura

### ✅ Boas Práticas para RLS

1. **Nunca referencie a mesma tabela na política RLS**
   ```sql
   -- ❌ EVITE
   CREATE POLICY "my_policy" ON table_a
   USING (id IN (SELECT some_id FROM table_a WHERE ...));
   ```

2. **Use funções SECURITY DEFINER para lógica complexa**
   ```sql
   -- ✅ RECOMENDADO
   CREATE FUNCTION check_access(...) RETURNS BOOLEAN
   SECURITY DEFINER AS $$...$$;

   CREATE POLICY "my_policy" ON table_a
   USING (check_access(id, auth.uid()));
   ```

3. **Teste políticas RLS em ambiente de desenvolvimento**
   ```sql
   -- Testar como usuário específico
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims.sub = 'user-uuid-here';
   SELECT * FROM shopping_lists;
   ```

4. **Use EXISTS ao invés de IN para subqueries**
   ```sql
   -- ✅ MELHOR PERFORMANCE
   EXISTS (SELECT 1 FROM list_members WHERE ...)

   -- ❌ PIOR PERFORMANCE
   id IN (SELECT list_id FROM list_members WHERE ...)
   ```

## Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

**Data:** 2025-11-13
**Versão:** 1.0.0
**Status:** ✅ Resolvido
