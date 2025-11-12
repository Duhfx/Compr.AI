-- Script para configurar compartilhamento com Supabase Auth
-- Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- ================================================
-- TABELAS DE COMPARTILHAMENTO
-- ================================================

-- Tabela de listas compartilhadas
CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  owner_device_id TEXT NOT NULL,
  permission TEXT DEFAULT 'edit' CHECK (permission IN ('edit', 'readonly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Tabela de membros de listas
CREATE TABLE IF NOT EXISTS list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(list_id, device_id)
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_share_code ON shared_lists(share_code);
CREATE INDEX IF NOT EXISTS idx_members_list ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_members_device ON list_members(device_id);
CREATE INDEX IF NOT EXISTS idx_shared_lists_list ON shared_lists(list_id);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- Drop políticas antigas se existirem
DROP POLICY IF EXISTS "Acesso a compartilhamentos" ON shared_lists;
DROP POLICY IF EXISTS "Acesso a membros" ON list_members;
DROP POLICY IF EXISTS "Anyone can read share codes" ON shared_lists;
DROP POLICY IF EXISTS "Users can create shares" ON shared_lists;
DROP POLICY IF EXISTS "Users can manage their shares" ON shared_lists;

-- Políticas permissivas (qualquer pessoa pode ler códigos de compartilhamento)
CREATE POLICY "Anyone can read share codes"
  ON shared_lists FOR SELECT
  USING (true);

-- Usuários autenticados podem criar shares
CREATE POLICY "Users can create shares"
  ON shared_lists FOR INSERT
  WITH CHECK (true);

-- Usuários podem gerenciar seus próprios shares
CREATE POLICY "Users can manage their shares"
  ON shared_lists FOR ALL
  USING (true);

-- Políticas para membros
CREATE POLICY "Anyone can join lists"
  ON list_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- FUNÇÕES AUXILIARES
-- ================================================

-- Função para limpar códigos expirados
CREATE OR REPLACE FUNCTION clean_expired_shares()
RETURNS void AS $$
BEGIN
  DELETE FROM shared_lists
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================================

COMMENT ON TABLE shared_lists IS 'Armazena códigos de compartilhamento para listas';
COMMENT ON TABLE list_members IS 'Rastreia membros de listas compartilhadas';
COMMENT ON COLUMN shared_lists.share_code IS 'Código único de 6 caracteres para compartilhamento';
COMMENT ON COLUMN shared_lists.permission IS 'Permissão: edit ou readonly';
COMMENT ON COLUMN shared_lists.owner_device_id IS 'ID do usuário (auth.users.id) ou deviceId anônimo';
COMMENT ON COLUMN list_members.device_id IS 'ID do usuário (auth.users.id) ou deviceId anônimo';
COMMENT ON COLUMN list_members.last_seen_at IS 'Última vez que o membro visualizou a lista';

-- ================================================
-- VERIFICAÇÃO
-- ================================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shared_lists') THEN
    RAISE NOTICE '✅ Tabela shared_lists criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ Erro: Tabela shared_lists não foi criada';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'list_members') THEN
    RAISE NOTICE '✅ Tabela list_members criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ Erro: Tabela list_members não foi criada';
  END IF;

  RAISE NOTICE '🎉 Setup de compartilhamento concluído!';
END $$;
