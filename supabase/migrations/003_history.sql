-- supabase/migrations/003_history.sql
-- Release 3: Purchase History and AI Suggestions

-- Histórico de compras
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  unit TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL
);

CREATE INDEX idx_history_device ON purchase_history(device_id, purchased_at DESC);
CREATE INDEX idx_history_item ON purchase_history(item_name);

-- Trigger para registrar compras automaticamente
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

CREATE TRIGGER trigger_log_purchase
AFTER UPDATE ON shopping_items
FOR EACH ROW
EXECUTE FUNCTION log_purchase();

-- RLS
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso ao histórico"
  ON purchase_history FOR ALL
  USING (true)
  WITH CHECK (true);
