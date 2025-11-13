-- ============================================================================
-- MIGRATION 007: FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================================================
-- Copie e cole este arquivo completo no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/abcqyslruytnplsecgvv/sql
-- ============================================================================

-- Step 1: Disable RLS temporarily
ALTER TABLE shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE list_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
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

-- Step 3: Re-enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 4: Create helper functions (SECURITY DEFINER to avoid recursion)
-- ============================================================================

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

-- ============================================================================
-- Step 5: SHOPPING LISTS POLICIES (No recursion!)
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
-- Step 6: SHOPPING ITEMS POLICIES (Using helper functions)
-- ============================================================================

CREATE POLICY "shopping_items_select"
  ON shopping_items FOR SELECT
  USING (user_can_access_list(list_id, auth.uid()));

CREATE POLICY "shopping_items_insert"
  ON shopping_items FOR INSERT
  WITH CHECK (user_can_edit_list(list_id, auth.uid()));

CREATE POLICY "shopping_items_update"
  ON shopping_items FOR UPDATE
  USING (user_can_edit_list(list_id, auth.uid()));

CREATE POLICY "shopping_items_delete"
  ON shopping_items FOR DELETE
  USING (user_can_edit_list(list_id, auth.uid()));

-- ============================================================================
-- Step 7: SHARED LISTS POLICIES (Simple, no recursion)
-- ============================================================================

CREATE POLICY "shared_lists_select"
  ON shared_lists FOR SELECT
  USING (true);

CREATE POLICY "shared_lists_insert"
  ON shared_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shared_lists.list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "shared_lists_update"
  ON shared_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shared_lists.list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "shared_lists_delete"
  ON shared_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shared_lists.list_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- Step 8: LIST MEMBERS POLICIES (Using helper function)
-- ============================================================================

CREATE POLICY "list_members_select"
  ON list_members FOR SELECT
  USING (user_can_access_list(list_id, auth.uid()));

CREATE POLICY "list_members_insert"
  ON list_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "list_members_update"
  ON list_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_members.list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "list_members_delete"
  ON list_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_members.list_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION COMPLETED!
-- ============================================================================
-- Verifique se não há erros acima antes de testar a aplicação.
-- ============================================================================
