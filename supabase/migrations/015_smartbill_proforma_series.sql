-- 015: Adauga serie proforma SmartBill pe companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS smartbill_proforma_series TEXT;
