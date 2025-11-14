-- Migration 012: Add checked_by_user_id to shopping_items
-- Criado em: 2025-11-14
-- Propósito: Registrar quem marcou cada item como comprado

-- Adicionar coluna checked_by_user_id à tabela shopping_items
ALTER TABLE shopping_items
ADD COLUMN checked_by_user_id UUID;

-- Adicionar comentário na coluna
COMMENT ON COLUMN shopping_items.checked_by_user_id IS 'UUID do usuário que marcou o item como comprado';

-- Criar índice para performance
CREATE INDEX idx_items_checked_by ON shopping_items(checked_by_user_id);

-- Opcional: Adicionar constraint de foreign key (comentado porque user_id pode ser anônimo)
-- ALTER TABLE shopping_items
-- ADD CONSTRAINT fk_checked_by_user
-- FOREIGN KEY (checked_by_user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;
