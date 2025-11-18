-- Migration 015: Remove item from purchase_history when unchecked
-- When a user unchecks an item that was previously checked, remove it from the purchase history

-- Drop existing trigger and function to recreate
DROP TRIGGER IF EXISTS trigger_log_purchase ON shopping_items;
DROP FUNCTION IF EXISTS log_purchase();

-- Create updated function that handles both checking and unchecking
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log when item is marked as checked (purchased)
  IF NEW.checked = TRUE AND (OLD.checked = FALSE OR OLD.checked IS NULL) THEN
    INSERT INTO purchase_history (user_id, item_name, category, quantity, unit, list_id, purchased_at)
    SELECT
      sl.user_id,
      NEW.name,
      NEW.category,
      NEW.quantity,
      NEW.unit,
      NEW.list_id,
      NOW()
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id;
  END IF;

  -- Remove from history when item is unchecked
  IF NEW.checked = FALSE AND OLD.checked = TRUE THEN
    -- Delete the most recent purchase history entry for this item and user
    DELETE FROM purchase_history
    WHERE id IN (
      SELECT ph.id
      FROM purchase_history ph
      JOIN shopping_lists sl ON ph.list_id = sl.id
      WHERE ph.item_name = NEW.name
        AND ph.list_id = NEW.list_id
        AND sl.user_id = (SELECT user_id FROM shopping_lists WHERE id = NEW.list_id)
      ORDER BY ph.purchased_at DESC
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_log_purchase
AFTER UPDATE ON shopping_items
FOR EACH ROW
EXECUTE FUNCTION log_purchase();

-- Update comment to reflect new behavior
COMMENT ON FUNCTION log_purchase() IS 'Automatically logs items to purchase_history when marked as checked, and removes from history when unchecked';

-- ============================================
-- Migration complete
-- ============================================
-- This migration ensures:
-- ✅ Items are added to purchase_history when checked
-- ✅ Items are removed from purchase_history when unchecked
-- ✅ Only the most recent purchase entry is removed (preserves historical data if item was purchased multiple times)
