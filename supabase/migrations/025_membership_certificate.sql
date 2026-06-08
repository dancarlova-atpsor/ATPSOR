-- 025: Adeverință de Membru ATPSOR
-- Adaugă numerotare oficială + cod de verificare publică

ALTER TABLE membership_requests
  ADD COLUMN IF NOT EXISTS certificate_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_num INTEGER;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(certificate_number, '-', 3) AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM membership_requests
  WHERE certificate_number LIKE 'ATPSOR-' || current_year || '-%';
  RETURN 'ATPSOR-' || current_year || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE POLICY "Public can verify certificate by code" ON membership_requests
  FOR SELECT USING (
    verification_code IS NOT NULL
    AND certificate_number IS NOT NULL
    AND status = 'paid'
  );
