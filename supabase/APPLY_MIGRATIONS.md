# Como Aplicar as Migrations do Supabase

Este guia explica como aplicar as migrations do banco de dados no Supabase.

## Opção 1: Via Dashboard do Supabase (Recomendado para Produção)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Database** → **SQL Editor**
4. Abra o arquivo de migration (ex: `005_remove_devices_table.sql`)
5. Copie todo o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** para executar

## Opção 2: Via Supabase CLI (Recomendado para Desenvolvimento)

### Setup Inicial

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Linkar com seu projeto
supabase link --project-ref SEU_PROJECT_REF
```

Para encontrar seu `PROJECT_REF`:
1. Vá no Dashboard do Supabase
2. Settings → General
3. Copie o "Reference ID"

### Aplicar Migrations

```bash
# Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar uma migration específica
supabase db push --include-migrations 005_remove_devices_table.sql
```

## Migrations Disponíveis

### 005_remove_devices_table.sql
**Status:** Pronta para aplicar
**Descrição:** Remove a tabela `devices` e usa apenas `auth.users` do Supabase

**O que faz:**
- Remove a tabela `devices` (obsoleta após mudança para arquitetura Supabase-only)
- Renomeia `device_id` para `user_id` em todas as tabelas
- Atualiza RLS policies para usar `auth.uid()`
- Melhora performance com novos índices

**Importante:**
- Esta migration é **destrutiva** - remove a tabela `devices`
- Certifique-se de ter backup antes de aplicar
- Só aplique se já migrou para arquitetura Supabase-only

## Verificar se Migration foi Aplicada

```bash
# Via CLI
supabase migration list

# Via Dashboard
Database → Migrations → Verificar se aparece na lista
```

## Rollback (Em caso de problemas)

Não há rollback automático. Se precisar reverter:

1. Restaure do backup
2. Ou execute manualmente os comandos inversos:
   - Recriar tabela `devices`
   - Renomear `user_id` de volta para `device_id`
   - Restaurar políticas antigas

## Troubleshooting

### Erro: "permission denied"
- Certifique-se de estar usando a service key (não a anon key)
- Verifique se tem permissões de admin no projeto

### Erro: "relation does not exist"
- Verifique se as migrations anteriores (001-004) foram aplicadas
- Execute `supabase db pull` para ver o estado atual

### Erro: "constraint violation"
- Pode haver dados órfãos no banco
- Verifique e limpe dados inconsistentes antes de aplicar

## Suporte

Se tiver problemas:
1. Verifique os logs do Supabase (Dashboard → Logs)
2. Consulte a [documentação do Supabase](https://supabase.com/docs/guides/database/migrations)
3. Abra uma issue no repositório
