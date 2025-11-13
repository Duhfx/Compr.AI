# 🐛 Bugfix: Erro ao Marcar Item como Comprado

## Problema

Ao tentar marcar um item da lista como comprado (checked), a aplicação retornava o seguinte erro:

```
column "device_id" of relation "purchase_history" does not exist
Error code: 42703
```

### Sintomas
- ❌ Não conseguia marcar itens como comprados
- ❌ Console mostrava erro PostgreSQL 42703
- ❌ Histórico de compras não era registrado

## Causa Raiz

O trigger `log_purchase()` ainda estava usando a coluna antiga `device_id`, que foi renomeada para `user_id` na migration 005.

### Histórico

1. **Migration 003** criou a tabela `purchase_history` e o trigger `log_purchase()`
   - Usava `device_id` (sistema antigo sem auth)

2. **Migration 005** mudou de device-based para user-based auth
   - Renomeou `device_id` → `user_id` na tabela
   - **MAS** esqueceu de atualizar o trigger!

3. **Resultado:** Trigger tentava inserir em coluna inexistente

### Código Problemático

```sql
-- ❌ ERRADO: Trigger antigo (migration 003)
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checked = TRUE AND OLD.checked = FALSE THEN
    INSERT INTO purchase_history (device_id, item_name, category, quantity, unit, list_id)
    --                            ^^^^^^^^^ Coluna não existe mais!
    SELECT sl.device_id, NEW.name, NEW.category, NEW.quantity, NEW.unit, NEW.list_id
    --        ^^^^^^^^^ Coluna não existe mais!
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Solução

Criada migration 008 que recria o trigger com as colunas corretas:

```sql
-- ✅ CORRETO: Trigger atualizado (migration 008)
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checked = TRUE AND OLD.checked = FALSE THEN
    INSERT INTO purchase_history (user_id, item_name, category, quantity, unit, list_id)
    --                            ^^^^^^^ Coluna correta!
    SELECT sl.user_id, NEW.name, NEW.category, NEW.quantity, NEW.unit, NEW.list_id
    --        ^^^^^^^ Coluna correta!
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### O que foi mudado?

1. **`device_id` → `user_id`** em ambos os lugares:
   - Na cláusula INSERT
   - Na seleção de `sl.device_id`

2. **Adicionado `SECURITY DEFINER`**
   - Garante que o trigger execute com privilégios do owner
   - Evita problemas de permissão RLS

3. **Trigger recriado**
   - DROP e CREATE para garantir que está atualizado

## Como Aplicar a Correção

### Passo 1: Abrir Supabase SQL Editor

Acesse: https://supabase.com/dashboard/project/abcqyslruytnplsecgvv/sql

### Passo 2: Executar Migration

1. Abra o arquivo `APPLY_MIGRATION_008.sql` na raiz do projeto
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
2. Abra uma lista de compras
3. Marque um item como comprado (clique no checkbox)
4. Verifique que não há erros no console
5. O item deve ser marcado com sucesso

## Verificação do Histórico

Para verificar se o histórico está sendo registrado corretamente:

```sql
-- No SQL Editor do Supabase, execute:
SELECT * FROM purchase_history
ORDER BY purchased_at DESC
LIMIT 10;
```

Você deve ver registros de itens que foram marcados como comprados, com:
- ✅ `user_id` preenchido (UUID do usuário autenticado)
- ✅ `item_name` - nome do item
- ✅ `category` - categoria do item
- ✅ `quantity` e `unit`
- ✅ `purchased_at` - timestamp da compra
- ✅ `list_id` - referência à lista

## Arquivos Criados/Modificados

### Novos Arquivos

1. **`supabase/migrations/008_fix_purchase_history_trigger.sql`**
   - Migration oficial
   - Recria o trigger com colunas corretas

2. **`APPLY_MIGRATION_008.sql`**
   - Versão fácil de copiar/colar
   - Inclui comentários explicativos

3. **`BUGFIX_PURCHASE_HISTORY.md`**
   - Este documento

## Prevenção Futura

### ✅ Checklist ao Renomear Colunas

Quando renomear colunas em migrations futuras, sempre verificar:

1. **Triggers** que referenciam a coluna
2. **Functions** que usam a coluna
3. **Views** que selecionam a coluna
4. **Stored Procedures** que manipulam a coluna
5. **Constraints** que dependem da coluna
6. **Indexes** que incluem a coluna

### Script de Verificação

Antes de aplicar migrations que renomeiam colunas:

```sql
-- Encontrar todas as dependências de uma coluna
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%device_id%'
AND n.nspname NOT IN ('pg_catalog', 'information_schema');
```

## Impacto

### Antes da Correção
- ❌ Itens não podiam ser marcados como comprados
- ❌ Histórico de compras não funcionava
- ❌ Erro no console a cada tentativa

### Depois da Correção
- ✅ Itens são marcados normalmente
- ✅ Histórico registrado automaticamente
- ✅ Base para features futuras (sugestões baseadas em histórico)

## Features que Dependem Deste Bugfix

Com o histórico de compras funcionando, futuramente podemos implementar:

1. **Sugestões Inteligentes (Release 3)**
   - IA analisa histórico para sugerir itens
   - Frequência de compra por item
   - Padrões de consumo

2. **Estatísticas (Release 5)**
   - Itens mais comprados
   - Gastos ao longo do tempo
   - Comparação mês a mês

3. **Autocompletar Inteligente**
   - Sugerir itens com base no histórico
   - Pré-preencher quantidade usual

4. **Lembretes**
   - "Faz 2 semanas que você não compra leite"
   - Baseado em frequência histórica

## Referências

- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Supabase Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

## Relacionado

- **BUGFIX_RLS_RECURSION.md** - Outro fix de RLS policies
- **Migration 005** - Mudança de device_id para user_id
- **Migration 003** - Criação original do trigger

---

**Data:** 2025-11-13
**Versão:** 1.0.0
**Status:** ✅ Resolvido
