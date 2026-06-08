-- 024: Cereri de adeziune ATPSOR (taxă anuală 500 RON)
-- Workflow:
-- 1. Transportator completează form pe /membership → row nou cu status='pending_payment'
-- 2. Email automat cu IBAN + referință de plată
-- 3. Admin/Inspector confirmă plata în /dashboard/admin → status='paid'
-- 4. Crearea automată a contului transportator cu parolă random + email credențiale
-- 5. La 1 an de la paid_at → status='expired' (cron viitor) cu reminder reînnoire

CREATE TABLE IF NOT EXISTS membership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date firmă
  company_name TEXT NOT NULL,
  cui TEXT NOT NULL,
  company_address TEXT,
  company_city TEXT,
  company_county TEXT,
  company_phone TEXT,
  company_email TEXT NOT NULL,

  -- Date administrator
  admin_name TEXT NOT NULL,
  admin_phone TEXT,
  admin_email TEXT NOT NULL,

  -- Plată
  amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  currency TEXT NOT NULL DEFAULT 'RON',
  payment_reference TEXT UNIQUE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'rejected', 'expired', 'cancelled')),

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Legături după activare
  activated_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_company_id UUID REFERENCES companies(id) ON DELETE SET NULL
);

CREATE INDEX idx_membership_requests_status ON membership_requests(status);
CREATE INDEX idx_membership_requests_cui ON membership_requests(cui);
CREATE INDEX idx_membership_requests_created_at ON membership_requests(created_at DESC);
CREATE INDEX idx_membership_requests_payment_ref ON membership_requests(payment_reference);

ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit membership request" ON membership_requests
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins/inspectors can view all membership requests" ON membership_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'inspector'))
  );

CREATE POLICY "Admins/inspectors can update membership requests" ON membership_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'inspector'))
  );

CREATE POLICY "Admins can delete membership requests" ON membership_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
