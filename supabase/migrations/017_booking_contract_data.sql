-- 017: Coloane noi pe bookings pentru date contract direct
-- (la fluxul direct fara oferta, datele clientului + rutei nu erau accesibile)

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_city TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dropoff_city TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departure_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_address TEXT;
