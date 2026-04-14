-- 016: Adauga IBAN si banca pe companies (pentru transfer bancar)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_name TEXT;
