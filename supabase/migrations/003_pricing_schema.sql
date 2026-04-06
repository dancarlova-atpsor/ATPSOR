-- ============================================
-- PRICING - Tarife per transportator per categorie
-- Vizibile doar clientilor, NU si altor transportatori
-- ============================================

CREATE TABLE company_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_category TEXT NOT NULL CHECK (vehicle_category IN (
    'ridesharing', 'microbuz', 'midiautocar', 'autocar', 'autocar_maxi', 'autocar_grand_turismo'
  )),
  price_per_km NUMERIC(6,2) NOT NULL CHECK (price_per_km > 0),
  min_km_per_day INTEGER NOT NULL DEFAULT 200,
  overage_rate_per_km NUMERIC(6,2), -- tarif depasire km, optional
  currency TEXT NOT NULL DEFAULT 'RON',
  notes TEXT, -- conditii speciale
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, vehicle_category)
);

CREATE INDEX idx_pricing_company ON company_pricing(company_id);

-- RLS: Clients can see all pricing, transporters can only see their own
ALTER TABLE company_pricing ENABLE ROW LEVEL SECURITY;

-- Clients and admins can see all prices
CREATE POLICY "Clients can view all pricing" ON company_pricing FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('client', 'admin'))
);

-- Transporters can only see their own pricing
CREATE POLICY "Transporters can view own pricing" ON company_pricing FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

-- Transporters can manage their own pricing
CREATE POLICY "Transporters can insert own pricing" ON company_pricing FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Transporters can update own pricing" ON company_pricing FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

CREATE POLICY "Transporters can delete own pricing" ON company_pricing FOR DELETE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

-- Updated_at trigger
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON company_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at();
