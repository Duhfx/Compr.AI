-- Migration 001: Initial Schema for Compr.AI
-- Release 1 - MVP Base

-- Tabela de dispositivos (auth anônima)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de listas de compras
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'un',
  category TEXT,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lists_device ON shopping_lists(device_id);
CREATE INDEX IF NOT EXISTS idx_items_list ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_checked ON shopping_items(list_id, checked);

-- RLS (Row Level Security) - permite acesso anônimo
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (auth anônima)
-- Nota: Para Release 1, vamos usar políticas simples
-- Em produção, você deve melhorar isso com auth real

DO $$
BEGIN
  -- Políticas para devices
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'devices' AND policyname = 'Permitir acesso a próprio dispositivo'
  ) THEN
    CREATE POLICY "Permitir acesso a próprio dispositivo"
      ON devices FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Políticas para shopping_lists
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'shopping_lists' AND policyname = 'Permitir acesso a listas próprias'
  ) THEN
    CREATE POLICY "Permitir acesso a listas próprias"
      ON shopping_lists FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Políticas para shopping_items
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'shopping_items' AND policyname = 'Permitir acesso a itens'
  ) THEN
    CREATE POLICY "Permitir acesso a itens"
      ON shopping_items FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON shopping_items;
CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
