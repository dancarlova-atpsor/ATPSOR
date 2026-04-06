-- ============================================
-- DOCUMENTS SYSTEM - Required documents for transporters
-- ============================================

-- Document types enum-like check
-- company_license: Licență firmă transport
-- vehicle_registration_itp: Talon cu ITP valabil
-- certified_copy: Copie conformă (obligatorie pt vehicule > 9 locuri)
-- passenger_luggage_insurance: Asigurare bagaje și călători
-- rca_insurance: Asigurare obligatorie RCA

CREATE TABLE company_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'company_license'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_docs_company ON company_documents(company_id);
CREATE INDEX idx_company_docs_type ON company_documents(document_type);
CREATE INDEX idx_company_docs_expiry ON company_documents(expiry_date);

CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'vehicle_registration_itp',
    'certified_copy',
    'passenger_luggage_insurance',
    'rca_insurance'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_docs_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX idx_vehicle_docs_company ON vehicle_documents(company_id);
CREATE INDEX idx_vehicle_docs_type ON vehicle_documents(document_type);
CREATE INDEX idx_vehicle_docs_expiry ON vehicle_documents(expiry_date);

-- Function to check if a company has all required valid documents
CREATE OR REPLACE FUNCTION check_company_documents_valid(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_license BOOLEAN;
BEGIN
  -- Check company license
  SELECT EXISTS(
    SELECT 1 FROM company_documents
    WHERE company_id = p_company_id
      AND document_type = 'company_license'
      AND expiry_date >= CURRENT_DATE
      AND is_verified = TRUE
  ) INTO has_license;

  RETURN has_license;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a vehicle has all required valid documents
CREATE OR REPLACE FUNCTION check_vehicle_documents_valid(p_vehicle_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_seats INTEGER;
  has_itp BOOLEAN;
  has_certified_copy BOOLEAN;
  has_passenger_insurance BOOLEAN;
  has_rca BOOLEAN;
BEGIN
  -- Get vehicle seats
  SELECT seats INTO v_seats FROM vehicles WHERE id = p_vehicle_id;

  -- Check ITP (talon)
  SELECT EXISTS(
    SELECT 1 FROM vehicle_documents
    WHERE vehicle_id = p_vehicle_id
      AND document_type = 'vehicle_registration_itp'
      AND expiry_date >= CURRENT_DATE
  ) INTO has_itp;

  -- Check certified copy (only for vehicles > 9 seats)
  IF v_seats > 9 THEN
    SELECT EXISTS(
      SELECT 1 FROM vehicle_documents
      WHERE vehicle_id = p_vehicle_id
        AND document_type = 'certified_copy'
        AND expiry_date >= CURRENT_DATE
    ) INTO has_certified_copy;
  ELSE
    has_certified_copy := TRUE; -- Not required for 8+1
  END IF;

  -- Check passenger & luggage insurance (only for vehicles > 9 seats)
  IF v_seats > 9 THEN
    SELECT EXISTS(
      SELECT 1 FROM vehicle_documents
      WHERE vehicle_id = p_vehicle_id
        AND document_type = 'passenger_luggage_insurance'
        AND expiry_date >= CURRENT_DATE
    ) INTO has_passenger_insurance;
  ELSE
    has_passenger_insurance := TRUE; -- Not required for 8+1
  END IF;

  -- Check RCA
  SELECT EXISTS(
    SELECT 1 FROM vehicle_documents
    WHERE vehicle_id = p_vehicle_id
      AND document_type = 'rca_insurance'
      AND expiry_date >= CURRENT_DATE
  ) INTO has_rca;

  RETURN has_itp AND has_certified_copy AND has_passenger_insurance AND has_rca;
END;
$$ LANGUAGE plpgsql;

-- View for document status overview per company
CREATE OR REPLACE VIEW company_document_status AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  -- Company license status
  (SELECT expiry_date FROM company_documents
   WHERE company_id = c.id AND document_type = 'company_license'
   ORDER BY expiry_date DESC LIMIT 1) AS license_expiry,
  (SELECT expiry_date >= CURRENT_DATE FROM company_documents
   WHERE company_id = c.id AND document_type = 'company_license'
   ORDER BY expiry_date DESC LIMIT 1) AS license_valid,
  -- Count of vehicles with all valid docs
  (SELECT COUNT(*) FROM vehicles v
   WHERE v.company_id = c.id
     AND v.is_active = TRUE
     AND check_vehicle_documents_valid(v.id) = TRUE) AS vehicles_with_valid_docs,
  -- Total active vehicles
  (SELECT COUNT(*) FROM vehicles v
   WHERE v.company_id = c.id AND v.is_active = TRUE) AS total_active_vehicles
FROM companies c;

-- RLS for documents
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company docs viewable by owner and admins" ON company_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Company owners can upload docs" ON company_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "Company owners can update docs" ON company_documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vehicle docs viewable by owner and admins" ON vehicle_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Company owners can upload vehicle docs" ON vehicle_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "Company owners can update vehicle docs" ON vehicle_documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_company_docs_updated_at BEFORE UPDATE ON company_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vehicle_docs_updated_at BEFORE UPDATE ON vehicle_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
