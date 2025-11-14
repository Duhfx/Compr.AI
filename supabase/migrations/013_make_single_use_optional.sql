-- Migration: Make single-use optional for share codes
-- Description: Add 'single_use' flag to allow reusable share codes

-- Add 'single_use' column to control if code can be reused
ALTER TABLE shared_lists
ADD COLUMN IF NOT EXISTS single_use BOOLEAN DEFAULT TRUE;

-- Add comment explaining the feature
COMMENT ON COLUMN shared_lists.single_use IS 'If TRUE, code can only be used once. If FALSE, code can be reused until revoked.';

-- Update existing records to be single-use by default (backward compatibility)
UPDATE shared_lists
SET single_use = TRUE
WHERE single_use IS NULL;

-- Add index for better query performance on single_use queries
CREATE INDEX IF NOT EXISTS idx_shared_lists_single_use ON shared_lists(single_use, used);
