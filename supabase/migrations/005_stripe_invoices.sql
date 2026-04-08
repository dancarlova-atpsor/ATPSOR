-- 005: Stripe Connect + SmartBill invoices tracking
-- Adauga stripe_account_id si smartbill_series pe companies
-- Creaza tabelul invoices pentru tracking facturi SmartBill
-- Face offer_id nullable pe bookings (direct booking flow)

-- 1. Stripe Connect account ID pe companie
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS smartbill_series TEXT;

-- 2. bookings.offer_id trebuie sa fie nullable (direct booking flow trimite null)
ALTER TABLE bookings ALTER COLUMN offer_id DROP NOT NULL;

-- 3. Tabel invoices - tracking facturi SmartBill
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN (
    'transport',           -- Transportator → Client
    'commission',          -- ATPSOR → Transportator (5% comision)
    'luxuria_commission'   -- Luxuria → ATPSOR (50% din comision = 2.5% total)
  )),
  smartbill_number TEXT,
  smartbill_series TEXT,
  issuer_name TEXT NOT NULL,
  issuer_cui TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'RON',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pentru lookup rapid per booking
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);

-- Unique constraint: maxim o factura per tip per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_booking_type ON invoices(booking_id, invoice_type);

-- 4. RLS policies pentru invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admins vad totul
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clientul vede facturile de pe booking-urile lui
CREATE POLICY "Clients can view their booking invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = invoices.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

-- Transportatorul vede facturile de pe booking-urile companiei lui
CREATE POLICY "Transporters can view their company invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN companies ON companies.id = bookings.company_id
      WHERE bookings.id = invoices.booking_id
      AND companies.owner_id = auth.uid()
    )
  );

-- Service role poate insera (webhook-ul ruleaza server-side)
CREATE POLICY "Service role can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update invoices"
  ON invoices FOR UPDATE
  USING (true);
