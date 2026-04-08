-- Account approval system for transporters
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
