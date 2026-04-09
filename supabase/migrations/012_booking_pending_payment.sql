-- 012: Adauga status pending_payment pe bookings (transfer bancar)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled', 'pending_payment'));
