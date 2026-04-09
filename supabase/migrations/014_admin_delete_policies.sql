-- 014: Politici DELETE pentru admin pe toate tabelele principale

-- Admin poate sterge cereri de transport
CREATE POLICY "Admins can delete transport requests"
  ON transport_requests FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin poate sterge oferte
CREATE POLICY "Admins can delete offers"
  ON offers FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin poate sterge bookings
CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin poate sterge vehicle_blocks
CREATE POLICY "Admins can delete vehicle blocks"
  ON vehicle_blocks FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin poate sterge payments
CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
