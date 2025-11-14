-- Migration 010: Ensure history tables exist with correct schema
-- Safe to run even if tables already exist (idempotent)
-- Uses user_id (not device_id) to align with current auth system

-- ============================================
-- 1. Ensure purchase_history table exists
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users(id)
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'un',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_history_user ON purchase_history(user_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_item ON purchase_history(item_name);
CREATE INDEX IF NOT EXISTS idx_history_category ON purchase_history(category);

-- Add comments for documentation
COMMENT ON TABLE purchase_history IS 'Histórico de itens comprados - alimenta sugestões de IA e previsão de gastos';
COMMENT ON COLUMN purchase_history.user_id IS 'References auth.users(id) - usuário que comprou o item';
COMMENT ON COLUMN purchase_history.list_id IS 'Lista de origem (opcional) - pode ser NULL para compras via OCR';

-- ============================================
-- 2. Ensure price_history table exists
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users(id)
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  store TEXT,
  purchased_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_price_item ON price_history(item_name, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_user ON price_history(user_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_store ON price_history(store);

-- Add comments for documentation
COMMENT ON TABLE price_history IS 'Histórico de preços de produtos - usado para previsão de gastos e alertas';
COMMENT ON COLUMN price_history.user_id IS 'References auth.users(id) - usuário que registrou o preço';
COMMENT ON COLUMN price_history.store IS 'Nome da loja/estabelecimento onde foi comprado';

-- ============================================
-- 3. Ensure RLS is enabled
-- ============================================
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (idempotent)
DROP POLICY IF EXISTS "Acesso ao histórico" ON purchase_history;
DROP POLICY IF EXISTS "Acesso ao histórico de compras" ON purchase_history;
DROP POLICY IF EXISTS "Users can CRUD own purchase history" ON purchase_history;
DROP POLICY IF EXISTS "Permitir acesso ao histórico" ON purchase_history;

DROP POLICY IF EXISTS "Acesso ao histórico de preços" ON price_history;
DROP POLICY IF EXISTS "Users can CRUD own price history" ON price_history;
DROP POLICY IF EXISTS "Permitir acesso ao histórico de preços" ON price_history;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can CRUD own purchase history"
  ON purchase_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can CRUD own price history"
  ON price_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 4. Ensure trigger exists for auto-logging purchases
-- ============================================
-- Drop existing trigger and function to recreate (idempotent)
DROP TRIGGER IF EXISTS trigger_log_purchase ON shopping_items;
DROP FUNCTION IF EXISTS log_purchase();

-- Create function to log purchases when items are checked
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log when item is marked as checked (purchased)
  IF NEW.checked = TRUE AND (OLD.checked = FALSE OR OLD.checked IS NULL) THEN
    INSERT INTO purchase_history (user_id, item_name, category, quantity, unit, list_id, purchased_at)
    SELECT 
      sl.user_id, 
      NEW.name, 
      NEW.category, 
      NEW.quantity, 
      NEW.unit, 
      NEW.list_id,
      NOW()
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_log_purchase
AFTER UPDATE ON shopping_items
FOR EACH ROW
EXECUTE FUNCTION log_purchase();

-- Add comment explaining the trigger
COMMENT ON FUNCTION log_purchase() IS 'Automatically logs items to purchase_history when marked as checked (purchased)';

-- ============================================
-- 5. Grant necessary permissions
-- ============================================
-- Note: Supabase handles most permissions automatically via RLS
-- These are just for completeness

GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON price_history TO authenticated;

-- ============================================
-- Migration complete
-- ============================================
-- This migration ensures:
-- ✅ purchase_history table exists with user_id
-- ✅ price_history table exists with user_id
-- ✅ All indexes are created
-- ✅ RLS policies are in place
-- ✅ Auto-logging trigger is active
-- ✅ Safe to run multiple times (idempotent)
