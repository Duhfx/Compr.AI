# Como Aplicar a Migration 006

Esta migration corrige as políticas RLS (Row Level Security) do Supabase para permitir que usuários acessem listas compartilhadas.

## Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo `supabase/migrations/006_fix_rls_for_shared_lists.sql`
5. Clique em **Run**

## Opção 2: Via Supabase CLI

Se você tiver o Supabase CLI instalado:

```bash
# Instalar o CLI (se necessário)
npm install -g supabase

# Login
supabase login

# Link com o projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migration
supabase db push
```

## O que esta migration faz?

- ✅ Permite que usuários vejam listas das quais são membros
- ✅ Permite que membros com permissão `edit` modifiquem itens em listas compartilhadas
- ✅ Mantém segurança: apenas donos podem deletar listas
- ✅ Permite que qualquer um veja dados de `shared_lists` pelo código (necessário para validação)
- ✅ Permite que usuários se adicionem como membros (JOIN)
- ✅ Permite que donos gerenciem membros

## Problema que resolve

Antes desta migration, quando um usuário tentava entrar em uma lista compartilhada, recebia o erro:

```
Error fetching list: Cannot coerce the result to a single JSON object
The result contains 0 rows
```

Isso acontecia porque as políticas RLS impediam o acesso à lista mesmo após o usuário ser adicionado como membro.
