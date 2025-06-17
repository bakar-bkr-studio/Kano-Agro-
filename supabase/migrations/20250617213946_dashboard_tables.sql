/*
  # Tables for dashboard statistics
  Adds simple inventory and sales tables used to display stats on the home page.
*/

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nom_produit text NOT NULL,
  quantite numeric NOT NULL DEFAULT 0,
  unite text DEFAULT 'kg',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales table
CREATE TABLE IF NOT EXISTS ventes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid REFERENCES annonces(id) ON DELETE SET NULL,
  vendeur_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  acheteur_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  quantite numeric,
  montant numeric,
  devise text DEFAULT 'FCFA',
  date_vente timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;
CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stocks' AND policyname = 'Les utilisateurs gerent leurs stocks'
  ) THEN
    CREATE POLICY "Les utilisateurs gerent leurs stocks"
      ON stocks FOR ALL
      TO authenticated
      USING (utilisateur_id = auth.uid())
      WITH CHECK (utilisateur_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ventes' AND policyname = 'Les utilisateurs gerent leurs ventes'
  ) THEN
    CREATE POLICY "Les utilisateurs gerent leurs ventes"
      ON ventes FOR ALL
      TO authenticated
      USING (vendeur_id = auth.uid() OR acheteur_id = auth.uid())
      WITH CHECK (vendeur_id = auth.uid() OR acheteur_id = auth.uid());
  END IF;
END $$;
