-- Migration 008: Fix purchase_history trigger to use user_id instead of device_id
-- The trigger was still referencing device_id which was renamed to user_id in migration 005

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS trigger_log_purchase ON shopping_items;
DROP FUNCTION IF EXISTS log_purchase();

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION log_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when item is marked as checked (purchased)
  IF NEW.checked = TRUE AND OLD.checked = FALSE THEN
    INSERT INTO purchase_history (user_id, item_name, category, quantity, unit, list_id)
    SELECT sl.user_id, NEW.name, NEW.category, NEW.quantity, NEW.unit, NEW.list_id
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_log_purchase
AFTER UPDATE ON shopping_items
FOR EACH ROW
EXECUTE FUNCTION log_purchase();

-- Add comment explaining the trigger
COMMENT ON FUNCTION log_purchase() IS 'Automatically logs items to purchase_history when marked as checked';
