-- Migration 006: Fix RLS policies to allow shared list access
-- This migration updates RLS policies to allow users to access shared lists they are members of

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can create their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON shopping_lists;

DROP POLICY IF EXISTS "Users can view items from their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can create items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can update items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete items from their lists" ON shopping_items;

-- Shopping Lists: Allow access to own lists AND lists where user is a member
CREATE POLICY "Users can view their own lists and shared lists"
  ON shopping_lists FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    id IN (
      SELECT list_id FROM list_members
      WHERE user_id = auth.uid() AND is_active = true
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
    id IN (
      SELECT lm.list_id FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

CREATE POLICY "Users can delete their own lists"
  ON shopping_lists FOR DELETE
  USING (user_id = auth.uid());

-- Shopping Items: Allow access to items from own lists AND shared lists
CREATE POLICY "Users can view items from their lists and shared lists"
  ON shopping_items FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM shopping_lists
      WHERE user_id = auth.uid()
    )
    OR
    list_id IN (
      SELECT list_id FROM list_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create items in their lists and shared lists with edit permission"
  ON shopping_items FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM shopping_lists
      WHERE user_id = auth.uid()
    )
    OR
    list_id IN (
      SELECT lm.list_id FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

CREATE POLICY "Users can update items in their lists and shared lists with edit permission"
  ON shopping_items FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists
      WHERE user_id = auth.uid()
    )
    OR
    list_id IN (
      SELECT lm.list_id FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

CREATE POLICY "Users can delete items from their lists and shared lists with edit permission"
  ON shopping_items FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists
      WHERE user_id = auth.uid()
    )
    OR
    list_id IN (
      SELECT lm.list_id FROM list_members lm
      JOIN shared_lists sl ON sl.list_id = lm.list_id
      WHERE lm.user_id = auth.uid()
        AND lm.is_active = true
        AND sl.permission = 'edit'
    )
  );

-- Shared Lists: Allow viewing shared lists by share code (for validation)
DROP POLICY IF EXISTS "Anyone can view shared lists by code" ON shared_lists;
CREATE POLICY "Anyone can view shared lists by code"
  ON shared_lists FOR SELECT
  USING (true);

-- List Members: Users can view members of lists they own or are part of
DROP POLICY IF EXISTS "Users can view list members" ON list_members;
CREATE POLICY "Users can view list members"
  ON list_members FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
    OR
    list_id IN (
      SELECT list_id FROM list_members WHERE user_id = auth.uid() AND is_active = true
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
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );
