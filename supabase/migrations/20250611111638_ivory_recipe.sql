/*
  # Schéma complet pour la marketplace agricole

  1. Nouvelles Tables
    - `profiles` - Profils utilisateurs avec informations agricoles
      - `id` (uuid, primary key, référence auth.users)
      - `nom_complet` (text)
      - `telephone` (text)
      - `adresse` (text)
      - `type_agriculteur` (text)
      - `superficie_exploitation` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `categories_produits` - Catégories de produits agricoles
      - `id` (uuid, primary key)
      - `nom` (text, unique)
      - `description` (text)
      - `icone` (text)
      - `created_at` (timestamp)

    - `annonces` - Annonces de vente de produits
      - `id` (uuid, primary key)
      - `titre` (text)
      - `description` (text)
      - `prix` (numeric)
      - `unite_prix` (text)
      - `quantite_disponible` (text)
      - `categorie_id` (uuid, foreign key)
      - `vendeur_id` (uuid, foreign key)
      - `statut` (text, enum: disponible, vendu, suspendu)
      - `images` (text array)
      - `localisation` (text)
      - `date_publication` (timestamp)
      - `date_expiration` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour lecture publique des annonces disponibles
    - Policies pour CRUD des annonces par le propriétaire
    - Policies pour gestion des profils utilisateurs

  3. Fonctions et Triggers
    - Trigger pour mise à jour automatique des timestamps
    - Fonction pour validation des données
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vérifier et créer la fonction de mise à jour des timestamps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END $$;

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_complet text NOT NULL,
  telephone text,
  adresse text,
  type_agriculteur text CHECK (type_agriculteur IN ('petit_exploitant', 'moyen_exploitant', 'grand_exploitant', 'cooperative')),
  superficie_exploitation numeric DEFAULT 0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des catégories de produits
CREATE TABLE IF NOT EXISTS categories_produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text UNIQUE NOT NULL,
  description text,
  icone text DEFAULT 'Leaf',
  created_at timestamptz DEFAULT now()
);

-- Table des annonces
CREATE TABLE IF NOT EXISTS annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL CHECK (length(titre) >= 3 AND length(titre) <= 100),
  description text CHECK (length(description) <= 1000),
  prix numeric NOT NULL CHECK (prix > 0),
  unite_prix text NOT NULL DEFAULT 'FCFA/kg',
  quantite_disponible text NOT NULL,
  categorie_id uuid REFERENCES categories_produits(id) ON DELETE SET NULL,
  vendeur_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  statut text DEFAULT 'disponible' CHECK (statut IN ('disponible', 'vendu', 'suspendu')),
  images text[] DEFAULT '{}',
  localisation text,
  date_publication timestamptz DEFAULT now(),
  date_expiration timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les triggers seulement s'ils n'existent pas
DO $$
BEGIN
  -- Trigger pour profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON profiles 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger pour annonces
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_annonces_updated_at'
  ) THEN
    CREATE TRIGGER update_annonces_updated_at 
      BEFORE UPDATE ON annonces 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insertion des catégories par défaut
INSERT INTO categories_produits (nom, description, icone) VALUES
  ('Fruits', 'Fruits frais de saison', 'Apple'),
  ('Légumes', 'Légumes frais du jardin', 'Leaf'),
  ('Céréales', 'Céréales et grains', 'Wheat'),
  ('Tubercules', 'Pommes de terre, ignames, manioc', 'Carrot'),
  ('Légumineuses', 'Haricots, pois, lentilles', 'Sprout'),
  ('Épices', 'Épices et aromates', 'Flower2')
ON CONFLICT (nom) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;

-- Créer les policies seulement si elles n'existent pas
DO $$
BEGIN
  -- Policies pour profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Les utilisateurs peuvent voir tous les profils publics'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent voir tous les profils publics"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Les utilisateurs peuvent créer leur propre profil'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
      ON profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Les utilisateurs peuvent modifier leur propre profil'
  ) THEN
    CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Policies pour categories_produits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories_produits' AND policyname = 'Tout le monde peut voir les catégories'
  ) THEN
    CREATE POLICY "Tout le monde peut voir les catégories"
      ON categories_produits FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Policies pour annonces
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'annonces' AND policyname = 'Tout le monde peut voir les annonces disponibles'
  ) THEN
    CREATE POLICY "Tout le monde peut voir les annonces disponibles"
      ON annonces FOR SELECT
      TO authenticated
      USING (statut = 'disponible' OR vendeur_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'annonces' AND policyname = 'Les utilisateurs authentifiés peuvent créer des annonces'
  ) THEN
    CREATE POLICY "Les utilisateurs authentifiés peuvent créer des annonces"
      ON annonces FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = vendeur_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'annonces' AND policyname = 'Les vendeurs peuvent modifier leurs propres annonces'
  ) THEN
    CREATE POLICY "Les vendeurs peuvent modifier leurs propres annonces"
      ON annonces FOR UPDATE
      TO authenticated
      USING (auth.uid() = vendeur_id)
      WITH CHECK (auth.uid() = vendeur_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'annonces' AND policyname = 'Les vendeurs peuvent supprimer leurs propres annonces'
  ) THEN
    CREATE POLICY "Les vendeurs peuvent supprimer leurs propres annonces"
      ON annonces FOR DELETE
      TO authenticated
      USING (auth.uid() = vendeur_id);
  END IF;
END $$;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_annonces_statut ON annonces(statut);
CREATE INDEX IF NOT EXISTS idx_annonces_date_publication ON annonces(date_publication DESC);
CREATE INDEX IF NOT EXISTS idx_annonces_categorie ON annonces(categorie_id);
CREATE INDEX IF NOT EXISTS idx_annonces_vendeur ON annonces(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_annonces_localisation ON annonces(localisation);