-- Permite vizualizarea tarifelor de catre toti utilizatorii (inclusiv neautentificati)
-- Necesar pentru cautarea de transport fara cont

CREATE POLICY "Anyone can view pricing" ON company_pricing FOR SELECT USING (true);
