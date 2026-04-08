-- Add contract template fields to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contract_template_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contract_template_name TEXT;
