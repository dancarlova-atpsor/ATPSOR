-- 022: Rol nou 'inspector' (verificator) — pentru secretariatul asociatiei
-- Permisiuni:
--   - Vede companii, vehicule, utilizatori, rezervari, documente
--   - Verifica documente companii + vehicule
--   - Aproba/Verifica companii (Aproba & Publica)
--   - Posteaza articole (incl. categoria 'intalniri-autoritati')
-- NU poate:
--   - Sterge utilizatori, companii, sau articole
--   - Modifica rolurile altor utilizatori
--   - Vede credentialele financiare (SmartBill, Stripe) — limitat de RLS pe campuri sensibile

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['client'::text, 'transporter'::text, 'admin'::text, 'inspector'::text]));

-- Articles
DROP POLICY IF EXISTS "Admins can create articles" ON articles;
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;

CREATE POLICY "Admins/inspectors can create articles" ON articles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'inspector')));

CREATE POLICY "Admins/inspectors can update articles" ON articles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'inspector')));

CREATE POLICY "Admins/inspectors can view all articles" ON articles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'inspector')));

-- Document verification
DROP POLICY IF EXISTS "Admins can update company docs" ON company_documents;
DROP POLICY IF EXISTS "Admins can update vehicle docs" ON vehicle_documents;

CREATE POLICY "Admins/inspectors can update company docs" ON company_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'inspector')));

CREATE POLICY "Admins/inspectors can update vehicle docs" ON vehicle_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'inspector')));

CREATE POLICY "Inspectors can view all company docs" ON company_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'inspector'));

CREATE POLICY "Inspectors can view all vehicle docs" ON vehicle_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'inspector'));

-- Inspector poate verifica/aproba companii
CREATE POLICY "Inspectors can verify companies" ON companies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'inspector'));

CREATE POLICY "Inspectors can view all companies" ON companies FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'inspector'));

CREATE POLICY "Inspectors can view all profiles" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'inspector'));

CREATE POLICY "Inspectors can view all vehicles" ON vehicles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'inspector'));

CREATE POLICY "Inspectors can view all bookings" ON bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'inspector'));
