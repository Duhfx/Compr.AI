-- supabase/migrations/004_price_history.sql
-- Release 3/4: Price History (usado em Release 4 para OCR, mas preparando agora)

-- Histórico de preços
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  store TEXT,
  purchased_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_item ON price_history(item_name, purchased_at DESC);
CREATE INDEX idx_price_device ON price_history(device_id);

-- RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso ao histórico de preços"
  ON price_history FOR ALL
  USING (true)
  WITH CHECK (true);
