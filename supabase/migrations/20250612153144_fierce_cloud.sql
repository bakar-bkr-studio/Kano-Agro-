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

-- Create trigger for profiles updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create etats_nigeria table
CREATE TABLE IF NOT EXISTS etats_nigeria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text UNIQUE NOT NULL,
    code text UNIQUE NOT NULL,
    region text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create cultures_disponibles table
CREATE TABLE IF NOT EXISTS cultures_disponibles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text UNIQUE NOT NULL,
    categorie text NOT NULL,
    saison text,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Create categories_produits table
CREATE TABLE IF NOT EXISTS categories_produits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text UNIQUE NOT NULL,
    description text,
    icone text DEFAULT 'Leaf'::text,
    created_at timestamptz DEFAULT now()
);

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

-- Create trigger for annonces updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_annonces_updated_at ON annonces;
CREATE TRIGGER update_annonces_updated_at
    BEFORE UPDATE ON annonces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE etats_nigeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultures_disponibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate them
DO $$
BEGIN
    -- Drop existing policies for profiles
    DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON profiles;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON profiles;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir tous les profils publics" ON profiles;
    
    -- Drop existing policies for reference tables
    DROP POLICY IF EXISTS "Tout le monde peut voir les états" ON etats_nigeria;
    DROP POLICY IF EXISTS "Tout le monde peut voir les cultures" ON cultures_disponibles;
    DROP POLICY IF EXISTS "Tout le monde peut voir les catégories" ON categories_produits;
    
    -- Drop existing policies for annonces
    DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des annonces" ON annonces;
    DROP POLICY IF EXISTS "Les vendeurs peuvent modifier leurs propres annonces" ON annonces;
    DROP POLICY IF EXISTS "Les vendeurs peuvent supprimer leurs propres annonces" ON annonces;
    DROP POLICY IF EXISTS "Tout le monde peut voir les annonces disponibles" ON annonces;
END $$;

-- Create RLS policies for profiles
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

-- Create RLS policies for reference tables (read-only for authenticated users)
CREATE POLICY "Tout le monde peut voir les états"
    ON etats_nigeria FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Tout le monde peut voir les cultures"
    ON cultures_disponibles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Tout le monde peut voir les catégories"
    ON categories_produits FOR SELECT
    TO authenticated
    USING (true);

-- Create RLS policies for annonces
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

-- Insert default categories
INSERT INTO categories_produits (nom, description, icone) VALUES
    ('Fruits', 'Fruits frais et secs', 'Apple'),
    ('Légumes', 'Légumes frais et transformés', 'Carrot'),
    ('Céréales', 'Riz, maïs, mil, sorgho', 'Wheat'),
    ('Légumineuses', 'Haricots, pois, lentilles', 'Bean'),
    ('Tubercules', 'Igname, manioc, patate douce', 'Potato'),
    ('Épices', 'Épices et condiments', 'Pepper'),
    ('Huiles', 'Huiles végétales', 'Droplet'),
    ('Autres', 'Autres produits agricoles', 'Package')
ON CONFLICT (nom) DO NOTHING;

-- Insert sample Nigerian states
INSERT INTO etats_nigeria (nom, code, region) VALUES
    ('Kano', 'KN', 'Nord-Ouest'),
    ('Lagos', 'LA', 'Sud-Ouest'),
    ('Kaduna', 'KD', 'Nord-Ouest'),
    ('Rivers', 'RI', 'Sud-Sud'),
    ('Oyo', 'OY', 'Sud-Ouest'),
    ('Katsina', 'KT', 'Nord-Ouest'),
    ('Bauchi', 'BA', 'Nord-Est'),
    ('Jigawa', 'JI', 'Nord-Ouest'),
    ('Benue', 'BE', 'Centre'),
    ('Anambra', 'AN', 'Sud-Est'),
    ('Borno', 'BO', 'Nord-Est'),
    ('Delta', 'DE', 'Sud-Sud'),
    ('Imo', 'IM', 'Sud-Est'),
    ('Sokoto', 'SO', 'Nord-Ouest'),
    ('Osun', 'OS', 'Sud-Ouest')
ON CONFLICT (nom) DO NOTHING;

-- Insert sample crops
INSERT INTO cultures_disponibles (nom, categorie, saison, description) VALUES
    ('Maïs', 'Céréales', 'Saison des pluies', 'Céréale de base très cultivée'),
    ('Riz', 'Céréales', 'Saison des pluies', 'Céréale importante pour l''alimentation'),
    ('Mil', 'Céréales', 'Saison sèche', 'Céréale résistante à la sécheresse'),
    ('Sorgho', 'Céréales', 'Saison sèche', 'Céréale adaptée aux zones arides'),
    ('Igname', 'Tubercules', 'Saison des pluies', 'Tubercule très nutritif'),
    ('Manioc', 'Tubercules', 'Toute l''année', 'Tubercule résistant et productif'),
    ('Patate douce', 'Tubercules', 'Saison des pluies', 'Tubercule riche en vitamines'),
    ('Haricot', 'Légumineuses', 'Saison des pluies', 'Légumineuse riche en protéines'),
    ('Arachide', 'Légumineuses', 'Saison des pluies', 'Oléagineuse et légumineuse'),
    ('Tomate', 'Légumes', 'Saison sèche', 'Légume très demandé'),
    ('Oignon', 'Légumes', 'Saison sèche', 'Légume de conservation'),
    ('Piment', 'Épices', 'Toute l''année', 'Épice très utilisée'),
    ('Gombo', 'Légumes', 'Saison des pluies', 'Légume traditionnel'),
    ('Pastèque', 'Fruits', 'Saison sèche', 'Fruit rafraîchissant'),
    ('Mangue', 'Fruits', 'Saison sèche', 'Fruit tropical populaire')
ON CONFLICT (nom) DO NOTHING;