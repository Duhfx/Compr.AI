# Como aplicar a migration 011 (campo deleted)

## Opção 1: Via Supabase Dashboard (SQL Editor)

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "SQL Editor" no menu lateral
4. Clique em "New query"
5. Cole o seguinte SQL:

```sql
-- Migration 011: Add deleted field to shopping_items
-- This allows soft delete functionality with a "Deleted Items" section

-- Add deleted and deleted_at columns
ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for filtering deleted items
CREATE INDEX IF NOT EXISTS idx_items_deleted ON shopping_items(list_id, deleted);

-- Create index for deleted items ordered by deletion date
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON shopping_items(list_id, deleted, deleted_at DESC);

-- Update existing items to have deleted = false
UPDATE shopping_items SET deleted = FALSE WHERE deleted IS NULL;
```

6. Clique em "Run" para executar
7. Verifique se apareceu "Success. No rows returned"

## Verificar se funcionou

Execute esta query no SQL Editor:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shopping_items'
  AND column_name IN ('deleted', 'deleted_at');
```

Você deve ver algo como:

| column_name | data_type | is_nullable | column_default |
|-------------|-----------|-------------|----------------|
| deleted     | boolean   | YES         | false          |
| deleted_at  | timestamp | YES         | NULL           |

## Opção 2: Via Supabase CLI (se disponível)

```bash
supabase db push
```

Isso aplicará automaticamente a migration localizada em:
`supabase/migrations/011_add_deleted_field.sql`
