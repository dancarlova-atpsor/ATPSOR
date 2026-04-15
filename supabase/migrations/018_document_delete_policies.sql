-- 018: Policies DELETE pe documente (lipseau in migrarea 002)
-- Permite transportatorilor sa stearga documentele proprii + admin orice document

CREATE POLICY "Company owners can delete company docs" ON company_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Admins can delete company docs" ON company_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Company owners can delete vehicle docs" ON vehicle_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Admins can delete vehicle docs" ON vehicle_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin poate actualiza documente (pentru verificare)
CREATE POLICY "Admins can update company docs" ON company_documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update vehicle docs" ON vehicle_documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
