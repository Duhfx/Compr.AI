-- ============================================
-- MIGRATION 016: Fix "Leave List" Functionality
-- ============================================
--
-- PROBLEMA: Usuários não conseguem sair de listas compartilhadas
-- A política RLS atual só permite que donos de listas atualizem membros
--
-- SOLUÇÃO: Permitir que usuários atualizem seu próprio status de membership
--
-- COMO APLICAR:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute
-- ============================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "list_members_update" ON list_members;

-- Create new policy that allows:
-- 1. List owners to update any member
-- 2. Users to update their own membership (to leave)
CREATE POLICY "list_members_update"
  ON list_members FOR UPDATE
  USING (
    -- List owners can update any member
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_members.list_id AND user_id = auth.uid()
    )
    OR
    -- Users can update their own membership (to leave)
    user_id = auth.uid()
  );

-- Verify the policy
COMMENT ON POLICY "list_members_update" ON list_members IS
  'Allows list owners to manage members and users to leave lists they are part of';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute esta query para verificar que a policy foi criada corretamente:
--
-- SELECT * FROM pg_policies WHERE tablename = 'list_members' AND policyname = 'list_members_update';
-- ============================================
