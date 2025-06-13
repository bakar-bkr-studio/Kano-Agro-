/*
  # Amélioration complète du profil utilisateur

  1. Nouvelles colonnes pour profiles
    - nom_societe (optionnel)
    - langue_preferee (Hausa, Anglais, Français)
    - localisation détaillée (etat, lga, village_quartier)
    - coordonnees_gps (point géographique)
    - sexe (Homme, Femme, Préfère ne pas dire)
    - age_fourchette (18-25, 26-35, etc.)
    - type_utilisateur (producteur, acheteur, etc.)
    - cultures_pratiquees (array)
    - superficie_fourchette (Moins de 1 ha, 1-3 ha, etc.)
    - profil_verifie (boolean)
    - derniere_connexion (timestamp)

  2. Tables de référence
    - etats_nigeria (36 états + FCT avec régions)
    - cultures_disponibles (28 cultures principales avec catégories)

  3. Index et optimisations
    - Index sur les champs de recherche fréquents
    - Index géographiques pour les coordonnées GPS

  4. Sécurité
    - RLS activé sur toutes les tables
    - Policies pour lecture publique des données de référence
*/

-- Extension pour les types géographiques
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Ajouter les nouvelles colonnes à la table profiles
DO $$
BEGIN
  -- Nom de société (optionnel)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'nom_societe'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nom_societe text;
  END IF;

  -- Langue préférée
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'langue_preferee'
  ) THEN
    ALTER TABLE profiles ADD COLUMN langue_preferee text DEFAULT 'Hausa' 
    CHECK (langue_preferee IN ('Hausa', 'Anglais', 'Français'));
  END IF;

  -- Localisation détaillée
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'etat'
  ) THEN
    ALTER TABLE profiles ADD COLUMN etat text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'lga'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lga text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'village_quartier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN village_quartier text;
  END IF;

  -- Coordonnées GPS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'coordonnees_gps'
  ) THEN
    ALTER TABLE profiles ADD COLUMN coordonnees_gps point;
  END IF;

  -- Sexe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'sexe'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sexe text 
    CHECK (sexe IN ('Homme', 'Femme', 'Préfère ne pas dire'));
  END IF;

  -- Âge (fourchette)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'age_fourchette'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age_fourchette text 
    CHECK (age_fourchette IN ('18-25', '26-35', '36-45', '46-55', '56-65', '65+'));
  END IF;

  -- Type d'utilisateur
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'type_utilisateur'
  ) THEN
    ALTER TABLE profiles ADD COLUMN type_utilisateur text DEFAULT 'producteur'
    CHECK (type_utilisateur IN ('producteur', 'acheteur', 'prestataire_service', 'agent', 'cooperative', 'transformateur'));
  END IF;

  -- Cultures pratiquées (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cultures_pratiquees'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cultures_pratiquees text[] DEFAULT '{}';
  END IF;

  -- Superficie (fourchette)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'superficie_fourchette'
  ) THEN
    ALTER TABLE profiles ADD COLUMN superficie_fourchette text 
    CHECK (superficie_fourchette IN ('Moins de 1 ha', '1-3 ha', '3-10 ha', '10-50 ha', 'Plus de 50 ha'));
  END IF;

  -- Statut de vérification
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profil_verifie'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profil_verifie boolean DEFAULT false;
  END IF;

  -- Date de dernière connexion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'derniere_connexion'
  ) THEN
    ALTER TABLE profiles ADD COLUMN derniere_connexion timestamptz;
  END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_etat ON profiles(etat);
CREATE INDEX IF NOT EXISTS idx_profiles_lga ON profiles(lga);
CREATE INDEX IF NOT EXISTS idx_profiles_type_utilisateur ON profiles(type_utilisateur);
CREATE INDEX IF NOT EXISTS idx_profiles_cultures ON profiles USING GIN(cultures_pratiquees);
CREATE INDEX IF NOT EXISTS idx_profiles_coordonnees ON profiles USING GIST(coordonnees_gps);

-- Insérer des données de référence pour les états du Nigeria
CREATE TABLE IF NOT EXISTS etats_nigeria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  region text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insérer les états du Nigeria
INSERT INTO etats_nigeria (nom, code, region) VALUES
  ('Kano', 'KN', 'Nord-Ouest'),
  ('Kaduna', 'KD', 'Nord-Ouest'),
  ('Katsina', 'KT', 'Nord-Ouest'),
  ('Jigawa', 'JG', 'Nord-Ouest'),
  ('Kebbi', 'KB', 'Nord-Ouest'),
  ('Sokoto', 'SK', 'Nord-Ouest'),
  ('Zamfara', 'ZM', 'Nord-Ouest'),
  ('Bauchi', 'BC', 'Nord-Est'),
  ('Borno', 'BO', 'Nord-Est'),
  ('Gombe', 'GM', 'Nord-Est'),
  ('Yobe', 'YB', 'Nord-Est'),
  ('Adamawa', 'AD', 'Nord-Est'),
  ('Taraba', 'TB', 'Nord-Est'),
  ('Benue', 'BN', 'Centre'),
  ('FCT', 'FC', 'Centre'),
  ('Kogi', 'KG', 'Centre'),
  ('Kwara', 'KW', 'Centre'),
  ('Nasarawa', 'NS', 'Centre'),
  ('Niger', 'NG', 'Centre'),
  ('Plateau', 'PL', 'Centre'),
  ('Abia', 'AB', 'Sud-Est'),
  ('Anambra', 'AN', 'Sud-Est'),
  ('Ebonyi', 'EB', 'Sud-Est'),
  ('Enugu', 'EN', 'Sud-Est'),
  ('Imo', 'IM', 'Sud-Est'),
  ('Akwa Ibom', 'AK', 'Sud-Sud'),
  ('Bayelsa', 'BY', 'Sud-Sud'),
  ('Cross River', 'CR', 'Sud-Sud'),
  ('Delta', 'DT', 'Sud-Sud'),
  ('Edo', 'ED', 'Sud-Sud'),
  ('Rivers', 'RV', 'Sud-Sud'),
  ('Ekiti', 'EK', 'Sud-Ouest'),
  ('Lagos', 'LA', 'Sud-Ouest'),
  ('Ogun', 'OG', 'Sud-Ouest'),
  ('Ondo', 'ON', 'Sud-Ouest'),
  ('Osun', 'OS', 'Sud-Ouest'),
  ('Oyo', 'OY', 'Sud-Ouest')
ON CONFLICT (nom) DO NOTHING;

-- Table des cultures disponibles
CREATE TABLE IF NOT EXISTS cultures_disponibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text UNIQUE NOT NULL,
  categorie text NOT NULL,
  saison text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insérer les cultures principales du Nigeria (avec échappement correct des apostrophes)
INSERT INTO cultures_disponibles (nom, categorie, saison, description) VALUES
  ('Maïs', 'Céréales', 'Pluviale', 'Culture principale du Nord Nigeria'),
  ('Sorgho', 'Céréales', 'Pluviale', 'Résistant à la sécheresse'),
  ('Mil', 'Céréales', 'Pluviale', 'Culture traditionnelle du Sahel'),
  ('Riz', 'Céréales', 'Irrigué', 'Culture en zone humide'),
  ('Blé', 'Céréales', 'Saison sèche', 'Culture d''irrigation'),
  ('Tomate', 'Légumes', 'Toute saison', 'Légume de grande consommation'),
  ('Oignon', 'Légumes', 'Saison sèche', 'Culture de rente importante'),
  ('Poivron', 'Légumes', 'Toute saison', 'Légume à forte valeur ajoutée'),
  ('Gombo', 'Légumes', 'Pluviale', 'Légume traditionnel'),
  ('Épinard', 'Légumes', 'Toute saison', 'Légume feuille'),
  ('Niébé', 'Légumineuses', 'Pluviale', 'Haricot local riche en protéines'),
  ('Arachide', 'Légumineuses', 'Pluviale', 'Culture de rente et alimentation'),
  ('Soja', 'Légumineuses', 'Pluviale', 'Riche en protéines'),
  ('Igname', 'Tubercules', 'Pluviale', 'Tubercule de base'),
  ('Manioc', 'Tubercules', 'Pluviale', 'Résistant et nutritif'),
  ('Patate douce', 'Tubercules', 'Pluviale', 'Riche en vitamines'),
  ('Pomme de terre', 'Tubercules', 'Saison fraîche', 'Culture d''altitude'),
  ('Mangue', 'Fruits', 'Saison sèche', 'Fruit tropical populaire'),
  ('Orange', 'Fruits', 'Saison sèche', 'Agrume riche en vitamine C'),
  ('Banane plantain', 'Fruits', 'Toute saison', 'Fruit de base'),
  ('Papaye', 'Fruits', 'Toute saison', 'Fruit tropical'),
  ('Gingembre', 'Épices', 'Pluviale', 'Épice à forte valeur'),
  ('Piment', 'Épices', 'Toute saison', 'Épice locale importante'),
  ('Ail', 'Épices', 'Saison sèche', 'Condiment essentiel'),
  ('Sésame', 'Oléagineux', 'Pluviale', 'Graine oléagineuse'),
  ('Tournesol', 'Oléagineux', 'Pluviale', 'Production d''huile'),
  ('Coton', 'Industrielle', 'Pluviale', 'Fibre textile'),
  ('Canne à sucre', 'Industrielle', 'Irrigué', 'Production de sucre')
ON CONFLICT (nom) DO NOTHING;

-- Enable RLS sur les nouvelles tables
ALTER TABLE etats_nigeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultures_disponibles ENABLE ROW LEVEL SECURITY;

-- Policies pour les tables de référence (lecture publique)
CREATE POLICY "Tout le monde peut voir les états"
  ON etats_nigeria FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tout le monde peut voir les cultures"
  ON cultures_disponibles FOR SELECT
  TO authenticated
  USING (true);