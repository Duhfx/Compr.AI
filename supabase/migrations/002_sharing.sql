-- supabase/migrations/002_sharing.sql
-- Release 2: Sistema de Compartilhamento e Sincronização em Tempo Real

-- Tabela de listas compartilhadas
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  owner_device_id UUID REFERENCES devices(id),
  permission TEXT DEFAULT 'edit' CHECK (permission IN ('edit', 'readonly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Tabela de membros de listas
CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(list_id, device_id)
);

-- Índices para performance
CREATE INDEX idx_share_code ON shared_lists(share_code);
CREATE INDEX idx_members_list ON list_members(list_id);
CREATE INDEX idx_members_device ON list_members(device_id);
CREATE INDEX idx_shared_lists_list ON shared_lists(list_id);

-- RLS (Row Level Security) - permite acesso compartilhado
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para compartilhamento
CREATE POLICY "Acesso a compartilhamentos"
  ON shared_lists FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acesso a membros"
  ON list_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para limpar códigos expirados
CREATE OR REPLACE FUNCTION clean_expired_shares()
RETURNS void AS $$
BEGIN
  DELETE FROM shared_lists
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE shared_lists IS 'Armazena códigos de compartilhamento para listas';
COMMENT ON TABLE list_members IS 'Rastreia membros de listas compartilhadas';
COMMENT ON COLUMN shared_lists.share_code IS 'Código único de 6 caracteres para compartilhamento';
COMMENT ON COLUMN shared_lists.permission IS 'Permissão: edit ou readonly';
COMMENT ON COLUMN list_members.last_seen_at IS 'Última vez que o membro visualizou a lista';
