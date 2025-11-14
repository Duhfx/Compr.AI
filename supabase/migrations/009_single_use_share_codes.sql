-- Migration: Add single-use functionality to share codes
-- Description: Share codes can only be used once for security

-- Add 'used' column to track if code has been used
ALTER TABLE shared_lists
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE;

-- Add 'used_at' column to track when code was used
ALTER TABLE shared_lists
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- Add 'used_by_user_id' column to track who used the code
ALTER TABLE shared_lists
ADD COLUMN IF NOT EXISTS used_by_user_id UUID REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_lists_used ON shared_lists(used);

-- Add comment explaining the feature
COMMENT ON COLUMN shared_lists.used IS 'Marks if the share code has been used (single-use for security)';
COMMENT ON COLUMN shared_lists.used_at IS 'Timestamp when the code was first used';
COMMENT ON COLUMN shared_lists.used_by_user_id IS 'User ID who used the code';
