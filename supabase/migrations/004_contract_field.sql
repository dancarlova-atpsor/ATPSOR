-- Add contract PDF to offers
ALTER TABLE offers ADD COLUMN contract_url TEXT;
ALTER TABLE offers ADD COLUMN contract_name TEXT;

-- Add contract acceptance to bookings
ALTER TABLE bookings ADD COLUMN contract_accepted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN contract_accepted_at TIMESTAMPTZ;
