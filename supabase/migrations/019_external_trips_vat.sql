-- 019: Curse externe + detectare plătitor TVA + curs BNR
-- Permite cotatii in EUR, TVA 0% SDD pentru externe, TVA 0% pentru neplatitori TVA

-- A) Companii: flag plătitor TVA + tarif extern + serie SmartBill pentru extern
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS is_vat_payer BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS price_per_km_external_eur NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS smartbill_series_external TEXT,
  ADD COLUMN IF NOT EXISTS vat_payer_checked_at TIMESTAMPTZ;

-- B) Transport requests: țară plecare/destinație + flag internațional + moneda
ALTER TABLE transport_requests
  ADD COLUMN IF NOT EXISTS pickup_country TEXT DEFAULT 'RO',
  ADD COLUMN IF NOT EXISTS dropoff_country TEXT DEFAULT 'RO',
  ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'RON';

-- C) Oferte: flag internațional + moneda (pentru a calcula preț corect)
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'RON';

-- D) Bookings: moneda + flag internațional + curs BNR folosit
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS currency_used TEXT DEFAULT 'RON',
  ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(10, 4);

-- E) Tabela pentru curs BNR zilnic (cache)
CREATE TABLE IF NOT EXISTS bnr_exchange_rates (
  date DATE PRIMARY KEY,
  eur_ron NUMERIC(10, 4) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: oricine poate citi (publică), doar service role poate insera
ALTER TABLE bnr_exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read exchange rates" ON bnr_exchange_rates
  FOR SELECT USING (TRUE);

-- F) Index pentru query rapid
CREATE INDEX IF NOT EXISTS idx_bnr_exchange_rates_date ON bnr_exchange_rates(date DESC);
