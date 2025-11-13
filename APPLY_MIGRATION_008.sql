-- ============================================================================
-- MIGRATION 008: FIX PURCHASE_HISTORY TRIGGER
-- ============================================================================
-- Copie e cole este arquivo completo no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/abcqyslruytnplsecgvv/sql
--
-- PROBLEMA: O trigger log_purchase() estava usando device_id que foi renomeado
--           para user_id na migration 005, causando erro ao marcar itens como
--           comprados.
--
-- SOLUÇÃO: Recriar o trigger com a coluna correta (user_id)
-- ============================================================================

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

-- ============================================================================
-- MIGRATION COMPLETED!
-- ============================================================================
-- Agora você pode marcar itens como comprados sem erros.
-- O histórico de compras será registrado automaticamente.
-- ============================================================================
