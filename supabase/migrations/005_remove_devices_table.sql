-- Migration 005: Remove devices table and use auth.users directly
-- This simplifies the architecture by relying on Supabase Auth users

-- Step 1: Drop foreign key constraints that reference devices
ALTER TABLE shopping_lists DROP CONSTRAINT IF EXISTS shopping_lists_device_id_fkey;
ALTER TABLE list_members DROP CONSTRAINT IF EXISTS list_members_device_id_fkey;
ALTER TABLE shared_lists DROP CONSTRAINT IF EXISTS shared_lists_owner_device_id_fkey;
ALTER TABLE purchase_history DROP CONSTRAINT IF EXISTS purchase_history_device_id_fkey;
ALTER TABLE price_history DROP CONSTRAINT IF EXISTS price_history_device_id_fkey;

-- Step 2: Rename device_id columns to user_id for clarity
ALTER TABLE shopping_lists RENAME COLUMN device_id TO user_id;
ALTER TABLE list_members RENAME COLUMN device_id TO user_id;
ALTER TABLE shared_lists RENAME COLUMN owner_device_id TO owner_user_id;
ALTER TABLE purchase_history RENAME COLUMN device_id TO user_id;
ALTER TABLE price_history RENAME COLUMN device_id TO user_id;

-- Step 3: Add foreign key constraints pointing to auth.users
-- Note: These are soft constraints since we can't directly reference auth.users
-- We'll rely on application logic to ensure data integrity

-- Add comments to document the relationship
COMMENT ON COLUMN shopping_lists.user_id IS 'References auth.users(id)';
COMMENT ON COLUMN list_members.user_id IS 'References auth.users(id)';
COMMENT ON COLUMN shared_lists.owner_user_id IS 'References auth.users(id)';
COMMENT ON COLUMN purchase_history.user_id IS 'References auth.users(id)';
COMMENT ON COLUMN price_history.user_id IS 'References auth.users(id)';

-- Step 4: Update indexes
DROP INDEX IF EXISTS idx_lists_device;
DROP INDEX IF EXISTS idx_members_device;
DROP INDEX IF EXISTS idx_history_device;
DROP INDEX IF EXISTS idx_price_device;

CREATE INDEX idx_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_members_user ON list_members(user_id);
CREATE INDEX idx_history_user ON purchase_history(user_id, purchased_at DESC);
CREATE INDEX idx_price_user ON price_history(user_id);

-- Step 5: Drop the devices table
DROP TABLE IF EXISTS devices CASCADE;

-- Step 6: Update RLS policies to use auth.uid()
-- Shopping Lists policies
DROP POLICY IF EXISTS "Acesso a listas próprias" ON shopping_lists;
CREATE POLICY "Users can manage their own lists"
  ON shopping_lists
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view shared lists"
  ON shopping_lists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_members
      WHERE list_members.list_id = shopping_lists.id
        AND list_members.user_id = auth.uid()
        AND list_members.is_active = true
    )
  );

-- Shopping Items policies
DROP POLICY IF EXISTS "Acesso a itens" ON shopping_items;
CREATE POLICY "Users can manage items in their lists"
  ON shopping_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage items in shared lists"
  ON shopping_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM list_members
      INNER JOIN shopping_lists ON shopping_lists.id = list_members.list_id
      WHERE shopping_items.list_id = list_members.list_id
        AND list_members.user_id = auth.uid()
        AND list_members.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM list_members
      INNER JOIN shopping_lists ON shopping_lists.id = list_members.list_id
      WHERE shopping_items.list_id = list_members.list_id
        AND list_members.user_id = auth.uid()
        AND list_members.is_active = true
    )
  );

-- List Members policies
DROP POLICY IF EXISTS "Acesso a membros" ON list_members;
CREATE POLICY "Users can view members of their lists"
  ON list_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_members.list_id
        AND shopping_lists.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "List owners can manage members"
  ON list_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_members.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_members.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

-- Shared Lists policies
DROP POLICY IF EXISTS "Acesso a compartilhamentos" ON shared_lists;
CREATE POLICY "List owners can manage sharing"
  ON shared_lists
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Anyone can view share codes to join"
  ON shared_lists
  FOR SELECT
  USING (true);

-- Purchase History policies
DROP POLICY IF EXISTS "Acesso ao histórico" ON purchase_history;
CREATE POLICY "Users can manage their own purchase history"
  ON purchase_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Price History policies
DROP POLICY IF EXISTS "Acesso ao histórico de preços" ON price_history;
CREATE POLICY "Users can manage their own price history"
  ON price_history
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
