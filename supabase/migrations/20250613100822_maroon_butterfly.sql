/*
  # Create Equipment Tables for Agricultural Machinery Rental
  
  1. New Tables
    - `categories_equipements` - Equipment categories (tractors, tools, transport)
    - `equipements` - Equipment listings for rental
    
  2. Security
    - Enable RLS on all tables
    - Policies for CRUD operations
    
  3. Performance
    - Indexes on frequently queried columns
*/

-- Create equipment categories table
CREATE TABLE IF NOT EXISTS categories_equipements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text UNIQUE NOT NULL,
    description text,
    icone text DEFAULT 'Wrench',
    created_at timestamptz DEFAULT now()
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom text NOT NULL CHECK (length(nom) >= 3 AND length(nom) <= 100),
    description text CHECK (length(description) <= 1000),
    prix_jour numeric NOT NULL CHECK (prix_jour > 0),
    prix_semaine numeric CHECK (prix_semaine > 0),
    prix_mois numeric CHECK (prix_mois > 0),
    devise text DEFAULT '₦' NOT NULL,
    categorie_id uuid REFERENCES categories_equipements(id) ON DELETE SET NULL,
    proprietaire_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    statut text DEFAULT 'disponible' CHECK (statut IN ('disponible', 'loue', 'maintenance', 'suspendu')),
    images text[] DEFAULT '{}',
    localisation text,
    zone_service text, -- Area where equipment can be delivered
    coordonnees_gps point,
    disponibilite_debut date,
    disponibilite_fin date,
    caracteristiques jsonb DEFAULT '{}', -- Technical specifications
    conditions_location text,
    note_moyenne numeric DEFAULT 0 CHECK (note_moyenne >= 0 AND note_moyenne <= 5),
    nombre_evaluations integer DEFAULT 0,
    date_publication timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations_equipements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipement_id uuid NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
    locataire_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    prix_total numeric NOT NULL CHECK (prix_total > 0),
    statut text DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee')),
    message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_dates CHECK (date_fin >= date_debut)
);

-- Create equipment reviews table
CREATE TABLE IF NOT EXISTS evaluations_equipements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipement_id uuid NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
    evaluateur_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reservation_id uuid REFERENCES reservations_equipements(id) ON DELETE SET NULL,
    note integer NOT NULL CHECK (note >= 1 AND note <= 5),
    commentaire text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(reservation_id) -- One review per reservation
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipements_categorie ON equipements USING btree (categorie_id);
CREATE INDEX IF NOT EXISTS idx_equipements_proprietaire ON equipements USING btree (proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_equipements_statut ON equipements USING btree (statut);
CREATE INDEX IF NOT EXISTS idx_equipements_localisation ON equipements USING btree (localisation);
CREATE INDEX IF NOT EXISTS idx_equipements_coordonnees ON equipements USING gist (coordonnees_gps);
CREATE INDEX IF NOT EXISTS idx_equipements_date_publication ON equipements USING btree (date_publication DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_equipement ON reservations_equipements USING btree (equipement_id);
CREATE INDEX IF NOT EXISTS idx_reservations_locataire ON reservations_equipements USING btree (locataire_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations_equipements USING btree (date_debut, date_fin);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_equipements_updated_at ON equipements;
CREATE TRIGGER update_equipements_updated_at
    BEFORE UPDATE ON equipements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations_equipements;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations_equipements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE categories_equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations_equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations_equipements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Categories (read-only for authenticated users)
CREATE POLICY "Everyone can view equipment categories"
    ON categories_equipements FOR SELECT
    TO authenticated
    USING (true);

-- Equipment policies
CREATE POLICY "Everyone can view available equipment"
    ON equipements FOR SELECT
    TO authenticated
    USING (statut = 'disponible' OR proprietaire_id = auth.uid());

CREATE POLICY "Authenticated users can create equipment listings"
    ON equipements FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "Owners can update their equipment"
    ON equipements FOR UPDATE
    TO authenticated
    USING (auth.uid() = proprietaire_id)
    WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "Owners can delete their equipment"
    ON equipements FOR DELETE
    TO authenticated
    USING (auth.uid() = proprietaire_id);

-- Reservations policies
CREATE POLICY "Users can view their reservations"
    ON reservations_equipements FOR SELECT
    TO authenticated
    USING (locataire_id = auth.uid() OR 
           equipement_id IN (SELECT id FROM equipements WHERE proprietaire_id = auth.uid()));

CREATE POLICY "Authenticated users can create reservations"
    ON reservations_equipements FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = locataire_id);

CREATE POLICY "Users can update their reservations"
    ON reservations_equipements FOR UPDATE
    TO authenticated
    USING (locataire_id = auth.uid() OR 
           equipement_id IN (SELECT id FROM equipements WHERE proprietaire_id = auth.uid()))
    WITH CHECK (locataire_id = auth.uid() OR 
                equipement_id IN (SELECT id FROM equipements WHERE proprietaire_id = auth.uid()));

-- Reviews policies
CREATE POLICY "Everyone can view reviews"
    ON evaluations_equipements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create reviews for their reservations"
    ON evaluations_equipements FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = evaluateur_id);

-- Insert default equipment categories
INSERT INTO categories_equipements (nom, description, icone) VALUES
    ('Tracteurs', 'Tracteurs agricoles de toutes puissances', 'Tractor'),
    ('Outils de labour', 'Charrues, herses, cultivateurs', 'Wrench'),
    ('Outils de semis', 'Semoirs, planteuses', 'Sprout'),
    ('Outils de récolte', 'Moissonneuses, faucheuses', 'Scissors'),
    ('Transport', 'Camionnettes, remorques', 'Truck'),
    ('Irrigation', 'Pompes, tuyaux, asperseurs', 'Droplets'),
    ('Transformation', 'Décortiqueuses, moulins', 'Settings'),
    ('Autres', 'Autres équipements agricoles', 'Package')
ON CONFLICT (nom) DO NOTHING;

-- Function to update equipment rating when a new review is added
CREATE OR REPLACE FUNCTION update_equipment_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE equipements 
    SET 
        note_moyenne = (
            SELECT AVG(note)::numeric(3,2) 
            FROM evaluations_equipements 
            WHERE equipement_id = NEW.equipement_id
        ),
        nombre_evaluations = (
            SELECT COUNT(*) 
            FROM evaluations_equipements 
            WHERE equipement_id = NEW.equipement_id
        )
    WHERE id = NEW.equipement_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS update_rating_on_review ON evaluations_equipements;
CREATE TRIGGER update_rating_on_review
    AFTER INSERT ON evaluations_equipements
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_rating();