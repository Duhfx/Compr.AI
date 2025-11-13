-- Migration 006: Fix RLS policies - Remove all recursion

-- First, disable RLS temporarily to drop policies
ALTER TABLE shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE list_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can view their own lists and shared lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update their own lists and shared lists with edit permission" ON shopping_lists;

DROP POLICY IF EXISTS "Users can view items from their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can create items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can update items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete items from their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can view items from their lists and shared lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can create items in their lists and shared lists with edit permission" ON shopping_items;
DROP POLICY IF EXISTS "Users can update items in their lists and shared lists with edit permission" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete items from their lists and shared lists with edit permission" ON shopping_items;

DROP POLICY IF EXISTS "Anyone can view shared lists by code" ON shared_lists;
DROP POLICY IF EXISTS "List owners can create share links" ON shared_lists;
DROP POLICY IF EXISTS "List owners can delete share links" ON shared_lists;

DROP POLICY IF EXISTS "Users can view list members" ON list_members;
DROP POLICY IF EXISTS "Users can join shared lists" ON list_members;
DROP POLICY IF EXISTS "List owners can manage members" ON list_members;

-- Re-enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- SHOPPING LISTS: Direct policies only
CREATE POLICY "select_own_and_shared_lists"
  ON shopping_lists FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    id IN (
      SELECT list_id FROM list_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "insert_own_lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_and_editable_shared_lists"
  ON shopping_lists FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    (
      id IN (
        SELECT lm.list_id FROM list_members lm
        WHERE lm.user_id = auth.uid() AND lm.is_active = true
      )
      AND
      id IN (
        SELECT list_id FROM shared_lists WHERE permission = 'edit'
      )
    )
  );

CREATE POLICY "delete_own_lists"
  ON shopping_lists FOR DELETE
  USING (user_id = auth.uid());

-- SHOPPING ITEMS: Reference list_id directly
CREATE POLICY "select_items_from_accessible_lists"
  ON shopping_items FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
    OR
    list_id IN (
      SELECT list_id FROM list_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "insert_items_in_accessible_lists"
  ON shopping_items FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
    OR
    (
      list_id IN (
        SELECT lm.list_id FROM list_members lm
        WHERE lm.user_id = auth.uid() AND lm.is_active = true
      )
      AND
      list_id IN (
        SELECT list_id FROM shared_lists WHERE permission = 'edit'
      )
    )
  );

CREATE POLICY "update_items_in_accessible_lists"
  ON shopping_items FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
    OR
    (
      list_id IN (
        SELECT lm.list_id FROM list_members lm
        WHERE lm.user_id = auth.uid() AND lm.is_active = true
      )
      AND
      list_id IN (
        SELECT list_id FROM shared_lists WHERE permission = 'edit'
      )
    )
  );

CREATE POLICY "delete_items_from_accessible_lists"
  ON shopping_items FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
    OR
    (
      list_id IN (
        SELECT lm.list_id FROM list_members lm
        WHERE lm.user_id = auth.uid() AND lm.is_active = true
      )
      AND
      list_id IN (
        SELECT list_id FROM shared_lists WHERE permission = 'edit'
      )
    )
  );

-- SHARED LISTS: Public read for validation
CREATE POLICY "select_shared_lists"
  ON shared_lists FOR SELECT
  USING (true);

CREATE POLICY "insert_share_links_for_own_lists"
  ON shared_lists FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "delete_own_share_links"
  ON shared_lists FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );

-- LIST MEMBERS: Simple policies
CREATE POLICY "select_members_of_accessible_lists"
  ON list_members FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
    OR
    list_id IN (
      SELECT lm.list_id FROM list_members lm
      WHERE lm.user_id = auth.uid() AND lm.is_active = true
    )
  );

CREATE POLICY "insert_self_as_member"
  ON list_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_members_of_own_lists"
  ON list_members FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );
