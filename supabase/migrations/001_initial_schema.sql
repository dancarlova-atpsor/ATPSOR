-- ATPSOR Platform Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'transporter', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- COMPANIES (transport companies)
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cui TEXT NOT NULL UNIQUE,
  license_number TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_county ON companies(county);
CREATE INDEX idx_companies_owner ON companies(owner_id);

-- ============================================
-- VEHICLES
-- ============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ridesharing', 'microbuz', 'midiautocar', 'autocar', 'autocar_maxi', 'autocar_grand_turismo')),
  seats INTEGER NOT NULL CHECK (seats >= 4 AND seats <= 80),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_vehicles_seats ON vehicles(seats);

-- ============================================
-- TRANSPORT REQUESTS
-- ============================================
CREATE TABLE transport_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  dropoff_city TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  is_round_trip BOOLEAN NOT NULL DEFAULT FALSE,
  passengers INTEGER NOT NULL CHECK (passengers >= 1),
  vehicle_category TEXT CHECK (vehicle_category IN ('ridesharing', 'microbuz', 'midiautocar', 'autocar', 'autocar_maxi', 'autocar_grand_turismo')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'fulfilled', 'cancelled', 'expired')),
  offers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_client ON transport_requests(client_id);
CREATE INDEX idx_requests_status ON transport_requests(status);
CREATE INDEX idx_requests_date ON transport_requests(departure_date);

-- ============================================
-- OFFERS
-- ============================================
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES transport_requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  currency TEXT NOT NULL DEFAULT 'RON',
  message TEXT,
  includes_driver BOOLEAN NOT NULL DEFAULT TRUE,
  includes_fuel BOOLEAN NOT NULL DEFAULT TRUE,
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, company_id)
);

CREATE INDEX idx_offers_request ON offers(request_id);
CREATE INDEX idx_offers_company ON offers(company_id);

-- Update offers_count on transport_requests
CREATE OR REPLACE FUNCTION update_offers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE transport_requests SET offers_count = offers_count + 1, status = 'active'
    WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE transport_requests SET offers_count = offers_count - 1
    WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_offer_change
  AFTER INSERT OR DELETE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_offers_count();

-- ============================================
-- BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
  total_price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_company ON bookings(company_id);

-- When booking is created, update offer and request status
CREATE OR REPLACE FUNCTION handle_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark the accepted offer
  UPDATE offers SET status = 'accepted' WHERE id = NEW.offer_id;

  -- Mark the request as fulfilled
  UPDATE transport_requests SET status = 'fulfilled'
  WHERE id = (SELECT request_id FROM offers WHERE id = NEW.offer_id);

  -- Reject other pending offers for this request
  UPDATE offers SET status = 'rejected'
  WHERE request_id = (SELECT request_id FROM offers WHERE id = NEW.offer_id)
    AND id != NEW.offer_id
    AND status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_booking_created();

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE INDEX idx_reviews_company ON reviews(company_id);

-- Update company rating on new review
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companies
  SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE company_id = NEW.company_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE company_id = NEW.company_id)
  WHERE id = NEW.company_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_company_rating();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies are viewable by everyone" ON companies FOR SELECT USING (true);
CREATE POLICY "Transporters can create companies" ON companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their company" ON companies FOR UPDATE USING (auth.uid() = owner_id);

-- Vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vehicles are viewable by everyone" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Company owners can manage vehicles" ON vehicles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "Company owners can update vehicles" ON vehicles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "Company owners can delete vehicles" ON vehicles FOR DELETE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

-- Transport Requests
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active requests are viewable by everyone" ON transport_requests FOR SELECT USING (true);
CREATE POLICY "Clients can create requests" ON transport_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update own requests" ON transport_requests FOR UPDATE USING (auth.uid() = client_id);

-- Offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers viewable by request owner and offer company" ON offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM transport_requests WHERE id = request_id AND client_id = auth.uid())
  OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "Company owners can create offers" ON offers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "Company owners can update own offers" ON offers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking parties can view" ON bookings FOR SELECT USING (
  auth.uid() = client_id OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "Clients can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking parties can view payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND (client_id = auth.uid() OR EXISTS (SELECT 1 FROM companies WHERE id = bookings.company_id AND owner_id = auth.uid())))
);

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON transport_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
