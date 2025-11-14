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
