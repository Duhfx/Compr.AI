-- Migration 016: Allow users to leave shared lists
-- Fix: RLS policy was blocking users from updating their own membership status
-- Now users can set is_active = false on their own list_members record

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
