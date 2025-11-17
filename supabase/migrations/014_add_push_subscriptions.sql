-- Migration: Adicionar suporte a Push Notifications
-- Adiciona coluna para armazenar subscriptions de push notifications

-- Adicionar coluna push_subscription em user_profiles
ALTER TABLE user_profiles
ADD COLUMN push_subscription JSONB;

-- Comentário explicativo
COMMENT ON COLUMN user_profiles.push_subscription
IS 'Push notification subscription object (endpoint, keys, expirationTime)';

-- Índice para consultas por subscription (útil para verificar duplicatas)
CREATE INDEX idx_user_profiles_push_subscription
ON user_profiles USING gin (push_subscription);

-- RLS já está configurado na tabela user_profiles,
-- usuários podem atualizar seus próprios perfis
