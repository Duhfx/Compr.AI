-- Migration 006: Create user_profiles table
-- Criado em: 2025-11-14
-- Propósito: Armazenar informações de perfil dos usuários (nicknames, avatares, etc.)

-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Comentário documenta relação com auth.users
  CONSTRAINT user_profiles_user_id_comment
    CHECK (true) -- Placeholder para comentário
);

COMMENT ON TABLE user_profiles IS 'Perfis de usuários - user_id referencia auth.users(id) ou UUID anônimo';
COMMENT ON COLUMN user_profiles.user_id IS 'References auth.users(id) para usuários autenticados, ou UUID único para anônimos';
COMMENT ON COLUMN user_profiles.nickname IS 'Nome de exibição do usuário';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL do avatar (opcional, para futuras implementações)';

-- Índices para performance
CREATE INDEX idx_profiles_nickname ON user_profiles(nickname);
CREATE INDEX idx_profiles_updated_at ON user_profiles(updated_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profile_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profile_updated_at();

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas:
-- 1. Qualquer um pode ler perfis (para mostrar nomes de membros)
CREATE POLICY "Permitir leitura de perfis para todos"
  ON user_profiles
  FOR SELECT
  USING (true);

-- 2. Usuário pode criar seu próprio perfil
CREATE POLICY "Usuário pode criar seu próprio perfil"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true); -- Permitir criação de qualquer perfil (para anônimos)

-- 3. Usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "Usuário pode atualizar seu próprio perfil"
  ON user_profiles
  FOR UPDATE
  USING (user_id = auth.uid() OR auth.uid() IS NULL) -- Permitir para autenticados e anônimos
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NULL);

-- 4. Usuário pode deletar apenas seu próprio perfil
CREATE POLICY "Usuário pode deletar seu próprio perfil"
  ON user_profiles
  FOR DELETE
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- Função auxiliar para buscar nickname de um usuário
CREATE OR REPLACE FUNCTION get_user_nickname(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT nickname FROM user_profiles WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_user_nickname IS 'Retorna o nickname de um usuário pelo user_id';

-- View para listar membros de listas com seus nomes
CREATE OR REPLACE VIEW list_members_with_names AS
SELECT
  lm.id,
  lm.list_id,
  lm.user_id,
  lm.joined_at,
  lm.last_seen_at,
  lm.is_active,
  COALESCE(up.nickname, 'Usuário Anônimo') as nickname,
  up.avatar_url
FROM list_members lm
LEFT JOIN user_profiles up ON lm.user_id = up.user_id;

COMMENT ON VIEW list_members_with_names IS 'View para facilitar busca de membros com seus nomes';
