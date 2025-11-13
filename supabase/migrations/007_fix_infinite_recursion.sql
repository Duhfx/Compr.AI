-- Migration 007: Fix infinite recursion in RLS policies
-- The problem: policies referencing the same table they protect cause recursion
-- Solution: Use SECURITY DEFINER functions to break the recursion chain

-- First, drop ALL existing policies to start fresh
ALTER TABLE shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE list_members DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'shopping_lists') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON shopping_lists';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'shopping_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON shopping_items';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'shared_lists') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON shared_lists';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'list_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON list_members';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SHOPPING LISTS POLICIES - No recursion
-- ============================================================================

-- SELECT: Own lists + lists where user is a member
CREATE POLICY "shopping_lists_select"
  ON shopping_lists FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM list_members
      WHERE list_members.list_id = shopping_lists.id
        AND list_members.user_id = auth.uid()
        AND list_members.is_active = true
    )
  );

-- INSERT: User can only create their own lists
CREATE POLICY "shopping_lists_insert"
  ON shopping_lists FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Own lists + shared lists with edit permission
CREATE POLICY "shopping_lists_update"
  ON shopping_lists FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    (
      EXISTS (
        SELECT 1 FROM list_members
        WHERE list_members.list_id = shopping_lists.id
          AND list_members.user_id = auth.uid()
          AND list_members.is_active = true
      )
      AND
      EXISTS (
        SELECT 1 FROM shared_lists
        WHERE shared_lists.list_id = shopping_lists.id
          AND shared_lists.permission = 'edit'
      )
    )
  );

-- DELETE: Only own lists
CREATE POLICY "shopping_lists_delete"
  ON shopping_lists FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- SHOPPING ITEMS POLICIES - No recursion
-- ============================================================================

-- Helper function to check if user has access to a list (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION user_can_access_list(check_list_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE id = check_list_id AND user_id = check_user_id
  ) OR EXISTS (
    SELECT 1 FROM list_members
    WHERE list_id = check_list_id
      AND user_id = check_user_id
      AND is_active = true
  );
END;
$$;

-- Helper function to check if user can edit a list (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION user_can_edit_list(check_list_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Owner can always edit
  IF EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE id = check_list_id AND user_id = check_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Member can edit if list has edit permission
  RETURN EXISTS (
    SELECT 1 FROM list_members lm
    JOIN shared_lists sl ON sl.list_id = lm.list_id
    WHERE lm.list_id = check_list_id
      AND lm.user_id = check_user_id
      AND lm.is_active = true
      AND sl.permission = 'edit'
  );
END;
$$;

-- SELECT: Items from lists user can access
CREATE POLICY "shopping_items_select"
  ON shopping_items FOR SELECT
  USING (user_can_access_list(list_id, auth.uid()));

-- INSERT: Items in lists user can edit
CREATE POLICY "shopping_items_insert"
  ON shopping_items FOR INSERT
  WITH CHECK (user_can_edit_list(list_id, auth.uid()));

-- UPDATE: Items in lists user can edit
CREATE POLICY "shopping_items_update"
  ON shopping_items FOR UPDATE
  USING (user_can_edit_list(list_id, auth.uid()));

-- DELETE: Items in lists user can edit
CREATE POLICY "shopping_items_delete"
  ON shopping_items FOR DELETE
  USING (user_can_edit_list(list_id, auth.uid()));

-- ============================================================================
-- SHARED LISTS POLICIES - Simple, no recursion
-- ============================================================================

-- SELECT: Anyone can view (needed for joining by share code)
CREATE POLICY "shared_lists_select"
  ON shared_lists FOR SELECT
  USING (true);

-- INSERT: Only list owners can create share links
CREATE POLICY "shared_lists_insert"
  ON shared_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shared_lists.list_id AND user_id = auth.uid()
    )
  );

-- DELETE: Only list owners can delete share links
CREATE POLICY "shared_lists_delete"
  ON shared_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shared_lists.list_id AND user_id = auth.uid()
    )
  );

-- UPDATE: Only list owners can update share links
CREATE POLICY "shared_lists_update"
  ON shared_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shared_lists.list_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- LIST MEMBERS POLICIES - Simple, no recursion
-- ============================================================================

-- SELECT: View members of lists you can access
CREATE POLICY "list_members_select"
  ON list_members FOR SELECT
  USING (user_can_access_list(list_id, auth.uid()));

-- INSERT: Users can add themselves to lists
CREATE POLICY "list_members_insert"
  ON list_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: List owners can update members
CREATE POLICY "list_members_update"
  ON list_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_members.list_id AND user_id = auth.uid()
    )
  );

-- DELETE: List owners can remove members
CREATE POLICY "list_members_delete"
  ON list_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_members.list_id AND user_id = auth.uid()
    )
  );
