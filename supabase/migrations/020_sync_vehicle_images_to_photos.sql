-- 020: Migrare pozele vechi din coloana 'images' in coloana 'photos'
-- Motivatie: vehiculele mai vechi (ex: Luxuria) au pozele in 'images',
-- vehiculele noi (ex: SMOTOCEL) le salveaza in 'photos'.
-- Pentru consistenta, copiem images -> photos daca photos e gol.
-- Nu stergem coloana 'images' (backward compat).

UPDATE vehicles
SET photos = images
WHERE (photos IS NULL OR array_length(photos, 1) IS NULL)
  AND images IS NOT NULL
  AND array_length(images, 1) > 0;
