-- 011: Adauga statusuri noi pentru facturi: cancelled, reversed
-- Necesare pentru anulare/storno facturi SmartBill

-- Drop existing check constraint and recreate with new values
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('pending', 'issued', 'failed', 'cancelled', 'reversed'));
