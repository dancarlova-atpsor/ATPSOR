-- 021: Permit transportatorilor sa actualizeze statusul rezervarilor propriei firme
-- Inainte de acest policy, transportatorii puteau doar SELECT booking-urile lor.
-- Acum pot face UPDATE pentru a schimba statusul (confirmed, in_progress, completed, cancelled).

CREATE POLICY "Company owners can update bookings" ON bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = bookings.company_id AND owner_id = auth.uid())
);
