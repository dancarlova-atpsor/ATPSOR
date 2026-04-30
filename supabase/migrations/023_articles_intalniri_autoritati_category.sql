-- 023: Adaug categoria 'intalniri-autoritati' la articles
-- Pentru sectiunea noua 'Întâlniri cu Autoritățile' din /activitati
-- Inainte: CHECK constraint permitea doar 4 categorii (intalniri, evenimente, comunicate, alte)
-- Acum: 5 categorii incluzand 'intalniri-autoritati'

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_category_check;
ALTER TABLE articles ADD CONSTRAINT articles_category_check
  CHECK (category = ANY (ARRAY[
    'intalniri'::text,
    'intalniri-autoritati'::text,
    'evenimente'::text,
    'comunicate'::text,
    'alte'::text
  ]));
