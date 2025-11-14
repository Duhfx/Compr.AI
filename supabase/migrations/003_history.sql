-- supabase/migrations/003_history.sql
-- Release 3 + 4: Histórico de compras e preços

-- ============================================
-- Histórico de compras (purchase_history)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'un',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_history_device ON purchase_history(device_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_item ON purchase_history(item_name);
CREATE INDEX IF NOT EXISTS idx_history_category ON purchase_history(category);

-- ============================================
-- Histórico de preços (price_history)
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  store TEXT,
  purchased_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_price_item ON price_history(item_name, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_device ON price_history(device_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_store ON price_history(store);

-- ============================================
-- Trigger: Registrar compras automaticamente
-- ============================================
-- Quando um item é marcado como comprado, registra no histórico
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checked = TRUE AND OLD.checked = FALSE THEN
    INSERT INTO purchase_history (device_id, item_name, category, quantity, unit, list_id)
    SELECT sl.device_id, NEW.name, NEW.category, NEW.quantity, NEW.unit, NEW.list_id
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_log_purchase ON shopping_items;
CREATE TRIGGER trigger_log_purchase
AFTER UPDATE ON shopping_items
FOR EACH ROW
EXECUTE FUNCTION log_purchase();

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (auth anônima baseada em device_id)
DROP POLICY IF EXISTS "Acesso ao histórico de compras" ON purchase_history;
CREATE POLICY "Acesso ao histórico de compras"
  ON purchase_history FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso ao histórico de preços" ON price_history;
CREATE POLICY "Acesso ao histórico de preços"
  ON price_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Comentários para documentação
-- ============================================
COMMENT ON TABLE purchase_history IS 'Histórico de itens comprados para sugestões inteligentes';
COMMENT ON TABLE price_history IS 'Histórico de preços para previsão de gastos';
COMMENT ON FUNCTION log_purchase() IS 'Registra automaticamente itens marcados como comprados';
