/*
  # Complete Database Schema Setup with Conflict Handling
  
  This migration creates the complete database schema for the agricultural marketplace,
  handling existing objects gracefully to avoid conflicts.
  
  1. Tables Created:
    - profiles: Enhanced user profiles with agricultural data
    - etats_nigeria: Nigerian states reference data
    - cultures_disponibles: Available crops reference data  
    - categories_produits: Product categories
    - annonces: Product listings/announcements
    
  2. Security:
    - Row Level Security enabled on all tables
    - Appropriate policies for data access control
    
  3. Performance:
    - Indexes on frequently queried columns
    - GIS indexes for location data
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create etats_nigeria table
CREATE TABLE IF NOT EXISTS etats_nigeria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text UNIQUE NOT NULL,
    code text UNIQUE NOT NULL,
    region text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS and create policies for etats_nigeria
ALTER TABLE etats_nigeria ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Tout le monde peut voir les états" ON etats_nigeria;
    CREATE POLICY "Tout le monde peut voir les états"
        ON etats_nigeria
        FOR SELECT
        TO authenticated
        USING (true);
END $$;

-- Create cultures_disponibles table
CREATE TABLE IF NOT EXISTS cultures_disponibles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text UNIQUE NOT NULL,
    categorie text NOT NULL,
    saison text,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS and create policies for cultures_disponibles
ALTER TABLE cultures_disponibles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Tout le monde peut voir les cultures" ON cultures_disponibles;
    CREATE POLICY "Tout le monde peut voir les cultures"
        ON cultures_disponibles
        FOR SELECT
        TO authenticated
        USING (true);
END $$;

-- Create categories_produits table
CREATE TABLE IF NOT EXISTS categories_produits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text UNIQUE NOT NULL,
    description text,
    icone text DEFAULT 'Leaf',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS and create policies for categories_produits
ALTER TABLE categories_produits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Tout le monde peut voir les catégories" ON categories_produits;
    CREATE POLICY "Tout le monde peut voir les catégories"
        ON categories_produits
        FOR SELECT
        TO authenticated
        USING (true);
END $$;

-- Create profiles table with all enhanced fields
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_complet text NOT NULL,
    telephone text,
    adresse text,
    type_agriculteur text CHECK (type_agriculteur = ANY (ARRAY['petit_exploitant'::text, 'moyen_exploitant'::text, 'grand_exploitant'::text, 'cooperative'::text])),
    superficie_exploitation numeric DEFAULT 0,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    nom_societe text,
    langue_preferee text DEFAULT 'Hausa'::text CHECK (langue_preferee = ANY (ARRAY['Hausa'::text, 'Anglais'::text, 'Français'::text])),
    etat text,
    lga text,
    village_quartier text,
    coordonnees_gps point,
    sexe text CHECK (sexe = ANY (ARRAY['Homme'::text, 'Femme'::text, 'Préfère ne pas dire'::text])),
    age_fourchette text CHECK (age_fourchette = ANY (ARRAY['18-25'::text, '26-35'::text, '36-45'::text, '46-55'::text, '56-65'::text, '65+'::text])),
    type_utilisateur text DEFAULT 'producteur'::text CHECK (type_utilisateur = ANY (ARRAY['producteur'::text, 'acheteur'::text, 'prestataire_service'::text, 'agent'::text, 'cooperative'::text, 'transformateur'::text])),
    cultures_pratiquees text[] DEFAULT '{}'::text[],
    superficie_fourchette text CHECK (superficie_fourchette = ANY (ARRAY['Moins de 1 ha'::text, '1-3 ha'::text, '3-10 ha'::text, '10-50 ha'::text, 'Plus de 50 ha'::text])),
    profil_verifie boolean DEFAULT false,
    derniere_connexion timestamptz
);

-- Add missing columns to existing profiles table
DO $$
BEGIN
    -- Add nom_societe if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nom_societe') THEN
        ALTER TABLE profiles ADD COLUMN nom_societe text;
    END IF;
    
    -- Add langue_preferee if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'langue_preferee') THEN
        ALTER TABLE profiles ADD COLUMN langue_preferee text DEFAULT 'Hausa'::text CHECK (langue_preferee = ANY (ARRAY['Hausa'::text, 'Anglais'::text, 'Français'::text]));
    END IF;
    
    -- Add etat if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'etat') THEN
        ALTER TABLE profiles ADD COLUMN etat text;
    END IF;
    
    -- Add lga if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lga') THEN
        ALTER TABLE profiles ADD COLUMN lga text;
    END IF;
    
    -- Add village_quartier if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'village_quartier') THEN
        ALTER TABLE profiles ADD COLUMN village_quartier text;
    END IF;
    
    -- Add coordonnees_gps if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'coordonnees_gps') THEN
        ALTER TABLE profiles ADD COLUMN coordonnees_gps point;
    END IF;
    
    -- Add sexe if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sexe') THEN
        ALTER TABLE profiles ADD COLUMN sexe text CHECK (sexe = ANY (ARRAY['Homme'::text, 'Femme'::text, 'Préfère ne pas dire'::text]));
    END IF;
    
    -- Add age_fourchette if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age_fourchette') THEN
        ALTER TABLE profiles ADD COLUMN age_fourchette text CHECK (age_fourchette = ANY (ARRAY['18-25'::text, '26-35'::text, '36-45'::text, '46-55'::text, '56-65'::text, '65+'::text]));
    END IF;
    
    -- Add type_utilisateur if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'type_utilisateur') THEN
        ALTER TABLE profiles ADD COLUMN type_utilisateur text DEFAULT 'producteur'::text CHECK (type_utilisateur = ANY (ARRAY['producteur'::text, 'acheteur'::text, 'prestataire_service'::text, 'agent'::text, 'cooperative'::text, 'transformateur'::text]));
    END IF;
    
    -- Add cultures_pratiquees if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cultures_pratiquees') THEN
        ALTER TABLE profiles ADD COLUMN cultures_pratiquees text[] DEFAULT '{}'::text[];
    END IF;
    
    -- Add superficie_fourchette if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'superficie_fourchette') THEN
        ALTER TABLE profiles ADD COLUMN superficie_fourchette text CHECK (superficie_fourchette = ANY (ARRAY['Moins de 1 ha'::text, '1-3 ha'::text, '3-10 ha'::text, '10-50 ha'::text, 'Plus de 50 ha'::text]));
    END IF;
    
    -- Add profil_verifie if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profil_verifie') THEN
        ALTER TABLE profiles ADD COLUMN profil_verifie boolean DEFAULT false;
    END IF;
    
    -- Add derniere_connexion if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'derniere_connexion') THEN
        ALTER TABLE profiles ADD COLUMN derniere_connexion timestamptz;
    END IF;
END $$;

-- Create indexes for profiles (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_coordonnees ON profiles USING gist (coordonnees_gps);
CREATE INDEX IF NOT EXISTS idx_profiles_cultures ON profiles USING gin (cultures_pratiquees);
CREATE INDEX IF NOT EXISTS idx_profiles_etat ON profiles USING btree (etat);
CREATE INDEX IF NOT EXISTS idx_profiles_lga ON profiles USING btree (lga);
CREATE INDEX IF NOT EXISTS idx_profiles_type_utilisateur ON profiles USING btree (type_utilisateur);

-- Enable RLS and create policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Drop existing policies for profiles
    DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON profiles;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON profiles;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir tous les profils publics" ON profiles;
    
    -- Create new policies
    CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
        ON profiles FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);

    CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
        ON profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

    CREATE POLICY "Les utilisateurs peuvent voir tous les profils publics"
        ON profiles FOR SELECT
        TO authenticated
        USING (true);
END $$;

-- Create trigger for profiles updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create annonces table
CREATE TABLE IF NOT EXISTS annonces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titre text NOT NULL CHECK ((length(titre) >= 3) AND (length(titre) <= 100)),
    description text CHECK (length(description) <= 1000),
    prix numeric NOT NULL CHECK (prix > 0),
    unite_prix text DEFAULT 'FCFA/kg'::text NOT NULL,
    quantite_disponible text NOT NULL,
    categorie_id uuid REFERENCES categories_produits(id) ON DELETE SET NULL,
    vendeur_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    statut text DEFAULT 'disponible'::text CHECK (statut = ANY (ARRAY['disponible'::text, 'vendu'::text, 'suspendu'::text])),
    images text[] DEFAULT '{}'::text[],
    localisation text,
    date_publication timestamptz DEFAULT now(),
    date_expiration timestamptz DEFAULT (now() + '30 days'::interval),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for annonces
CREATE INDEX IF NOT EXISTS idx_annonces_categorie ON annonces USING btree (categorie_id);
CREATE INDEX IF NOT EXISTS idx_annonces_date_publication ON annonces USING btree (date_publication DESC);
CREATE INDEX IF NOT EXISTS idx_annonces_localisation ON annonces USING btree (localisation);
CREATE INDEX IF NOT EXISTS idx_annonces_statut ON annonces USING btree (statut);
CREATE INDEX IF NOT EXISTS idx_annonces_vendeur ON annonces USING btree (vendeur_id);

-- Enable RLS and create policies for annonces
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Drop existing policies for annonces
    DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des annonces" ON annonces;
    DROP POLICY IF EXISTS "Les vendeurs peuvent modifier leurs propres annonces" ON annonces;
    DROP POLICY IF EXISTS "Les vendeurs peuvent supprimer leurs propres annonces" ON annonces;
    DROP POLICY IF EXISTS "Tout le monde peut voir les annonces disponibles" ON annonces;
    
    -- Create new policies
    CREATE POLICY "Les utilisateurs authentifiés peuvent créer des annonces"
        ON annonces FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = vendeur_id);

    CREATE POLICY "Les vendeurs peuvent modifier leurs propres annonces"
        ON annonces FOR UPDATE
        TO authenticated
        USING (auth.uid() = vendeur_id)
        WITH CHECK (auth.uid() = vendeur_id);

    CREATE POLICY "Les vendeurs peuvent supprimer leurs propres annonces"
        ON annonces FOR DELETE
        TO authenticated
        USING (auth.uid() = vendeur_id);

    CREATE POLICY "Tout le monde peut voir les annonces disponibles"
        ON annonces FOR SELECT
        TO authenticated
        USING ((statut = 'disponible'::text) OR (vendeur_id = auth.uid()));
END $$;

-- Create trigger for annonces updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_annonces_updated_at ON annonces;
CREATE TRIGGER update_annonces_updated_at
    BEFORE UPDATE ON annonces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default data for Nigerian states
INSERT INTO etats_nigeria (nom, code, region) VALUES
    ('Abia', 'AB', 'Sud-Est'),
    ('Adamawa', 'AD', 'Nord-Est'),
    ('Akwa Ibom', 'AK', 'Sud-Sud'),
    ('Anambra', 'AN', 'Sud-Est'),
    ('Bauchi', 'BA', 'Nord-Est'),
    ('Bayelsa', 'BY', 'Sud-Sud'),
    ('Benue', 'BN', 'Centre'),
    ('Borno', 'BO', 'Nord-Est'),
    ('Cross River', 'CR', 'Sud-Sud'),
    ('Delta', 'DE', 'Sud-Sud'),
    ('Ebonyi', 'EB', 'Sud-Est'),
    ('Edo', 'ED', 'Sud-Sud'),
    ('Ekiti', 'EK', 'Sud-Ouest'),
    ('Enugu', 'EN', 'Sud-Est'),
    ('Gombe', 'GO', 'Nord-Est'),
    ('Imo', 'IM', 'Sud-Est'),
    ('Jigawa', 'JI', 'Nord-Ouest'),
    ('Kaduna', 'KD', 'Nord-Ouest'),
    ('Kano', 'KN', 'Nord-Ouest'),
    ('Katsina', 'KT', 'Nord-Ouest'),
    ('Kebbi', 'KE', 'Nord-Ouest'),
    ('Kogi', 'KO', 'Centre'),
    ('Kwara', 'KW', 'Centre'),
    ('Lagos', 'LA', 'Sud-Ouest'),
    ('Nasarawa', 'NA', 'Centre'),
    ('Niger', 'NI', 'Centre'),
    ('Ogun', 'OG', 'Sud-Ouest'),
    ('Ondo', 'ON', 'Sud-Ouest'),
    ('Osun', 'OS', 'Sud-Ouest'),
    ('Oyo', 'OY', 'Sud-Ouest'),
    ('Plateau', 'PL', 'Centre'),
    ('Rivers', 'RI', 'Sud-Sud'),
    ('Sokoto', 'SO', 'Nord-Ouest'),
    ('Taraba', 'TA', 'Nord-Est'),
    ('Yobe', 'YO', 'Nord-Est'),
    ('Zamfara', 'ZA', 'Nord-Ouest'),
    ('FCT', 'FC', 'Centre')
ON CONFLICT (nom) DO NOTHING;

-- Insert default product categories
INSERT INTO categories_produits (nom, description, icone) VALUES
    ('Céréales', 'Riz, maïs, blé, mil, sorgho', 'Wheat'),
    ('Légumineuses', 'Haricots, pois chiches, lentilles', 'Bean'),
    ('Tubercules', 'Igname, manioc, patate douce', 'Potato'),
    ('Légumes', 'Tomates, oignons, poivrons, épinards', 'Carrot'),
    ('Fruits', 'Mangues, oranges, bananes, ananas', 'Apple'),
    ('Oléagineux', 'Arachides, sésame, tournesol', 'Nut'),
    ('Épices', 'Gingembre, piment, curcuma', 'Pepper'),
    ('Fibres', 'Coton, jute', 'Leaf')
ON CONFLICT (nom) DO NOTHING;

-- Insert common crops
INSERT INTO cultures_disponibles (nom, categorie, saison, description) VALUES
    ('Riz', 'Céréales', 'Saison des pluies', 'Culture de base importante'),
    ('Maïs', 'Céréales', 'Saison des pluies', 'Céréale polyvalente'),
    ('Mil', 'Céréales', 'Saison sèche', 'Résistant à la sécheresse'),
    ('Sorgho', 'Céréales', 'Saison sèche', 'Adapté aux zones arides'),
    ('Haricot', 'Légumineuses', 'Saison des pluies', 'Riche en protéines'),
    ('Arachide', 'Oléagineux', 'Saison des pluies', 'Culture de rente'),
    ('Igname', 'Tubercules', 'Saison des pluies', 'Tubercule nutritif'),
    ('Manioc', 'Tubercules', 'Toute saison', 'Résistant et nutritif'),
    ('Tomate', 'Légumes', 'Saison sèche', 'Légume populaire'),
    ('Oignon', 'Légumes', 'Saison sèche', 'Condiment essentiel'),
    ('Piment', 'Épices', 'Toute saison', 'Épice locale'),
    ('Gingembre', 'Épices', 'Saison des pluies', 'Épice médicinale'),
    ('Coton', 'Fibres', 'Saison des pluies', 'Culture industrielle'),
    ('Sésame', 'Oléagineux', 'Saison sèche', 'Graines oléagineuses')
ON CONFLICT (nom) DO NOTHING;