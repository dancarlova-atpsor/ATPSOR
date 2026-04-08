-- SmartBill credentials per transporter
ALTER TABLE companies ADD COLUMN IF NOT EXISTS smartbill_username TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS smartbill_token TEXT;
