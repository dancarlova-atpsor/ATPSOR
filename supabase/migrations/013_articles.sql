-- 013: Tabel articles pentru sectiunea Stiri/Activitati ATPSOR
-- Adminul publica activitati, intalniri, evenimente, comunicate

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL CHECK (category IN ('intalniri', 'evenimente', 'comunicate', 'alte')),
  images TEXT[] DEFAULT '{}',
  cover_image TEXT,
  author_id UUID NOT NULL REFERENCES profiles(id),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at DESC);

-- RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Oricine poate citi articolele publicate
CREATE POLICY "Published articles are viewable by everyone"
  ON articles FOR SELECT
  USING (is_published = true);

-- Admins vad toate articolele (inclusiv ciorne)
CREATE POLICY "Admins can view all articles"
  ON articles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Doar admins pot crea
CREATE POLICY "Admins can create articles"
  ON articles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Doar admins pot edita
CREATE POLICY "Admins can update articles"
  ON articles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Doar admins pot sterge
CREATE POLICY "Admins can delete articles"
  ON articles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
