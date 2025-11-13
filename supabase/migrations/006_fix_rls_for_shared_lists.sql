-- Migration 006: Fix RLS policies to allow shared list access
-- This migration updates RLS policies to allow users to access shared lists they are members of

-- Drop existing policies
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

-- Shopping Lists: Simple policies without recursion
CREATE POLICY "Users can view their own lists and shared lists"
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

CREATE POLICY "Users can create their own lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lists and shared lists with edit permission"
  ON shopping_lists FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.list_id = shopping_lists.id
        AND lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

CREATE POLICY "Users can delete their own lists"
  ON shopping_lists FOR DELETE
  USING (user_id = auth.uid());

-- Shopping Items: Simple policies without recursion
CREATE POLICY "Users can view items from their lists and shared lists"
  ON shopping_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM list_members
      WHERE list_members.list_id = shopping_items.list_id
        AND list_members.user_id = auth.uid()
        AND list_members.is_active = true
    )
  );

CREATE POLICY "Users can create items in their lists and shared lists with edit permission"
  ON shopping_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.list_id = shopping_items.list_id
        AND lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

CREATE POLICY "Users can update items in their lists and shared lists with edit permission"
  ON shopping_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.list_id = shopping_items.list_id
        AND lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

CREATE POLICY "Users can delete items from their lists and shared lists with edit permission"
  ON shopping_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.list_id = shopping_items.list_id
        AND lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

-- Shared Lists: Allow viewing shared lists by share code (for validation)
DROP POLICY IF EXISTS "Anyone can view shared lists by code" ON shared_lists;
CREATE POLICY "Anyone can view shared lists by code"
  ON shared_lists FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "List owners can create share links" ON shared_lists;
CREATE POLICY "List owners can create share links"
  ON shared_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shared_lists.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "List owners can delete share links" ON shared_lists;
CREATE POLICY "List owners can delete share links"
  ON shared_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shared_lists.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

-- List Members: Users can view members of lists they own or are part of
DROP POLICY IF EXISTS "Users can view list members" ON list_members;
CREATE POLICY "Users can view list members"
  ON list_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_members.list_id
        AND shopping_lists.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM list_members lm2
      WHERE lm2.list_id = list_members.list_id
        AND lm2.user_id = auth.uid()
        AND lm2.is_active = true
    )
  );

-- Allow inserting members (for joining)
DROP POLICY IF EXISTS "Users can join shared lists" ON list_members;
CREATE POLICY "Users can join shared lists"
  ON list_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow owners to remove members
DROP POLICY IF EXISTS "List owners can manage members" ON list_members;
CREATE POLICY "List owners can manage members"
  ON list_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_members.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );
