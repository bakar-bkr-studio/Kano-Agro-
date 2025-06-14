export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nom_complet: string
          nom_societe: string | null
          telephone: string | null
          email: string | null
          whatsapp: string | null
          bio: string | null
          adresse: string | null
          langue_preferee: 'Hausa' | 'Anglais' | 'Français' | null
          etat: string | null
          lga: string | null
          village_quartier: string | null
          coordonnees_gps: string | null // Point type as string
          sexe: 'Homme' | 'Femme' | 'Préfère ne pas dire' | null
          age_fourchette: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+' | null
          type_agriculteur: 'petit_exploitant' | 'moyen_exploitant' | 'grand_exploitant' | 'cooperative' | null
          type_utilisateur: (
            | 'producteur'
            | 'acheteur'
            | 'prestataire_service'
            | 'agent'
            | 'cooperative'
            | 'transformateur'
          )[] | null
          superficie_exploitation: number | null
          superficie_fourchette: 'Moins de 1 ha' | '1-3 ha' | '3-10 ha' | '10-50 ha' | 'Plus de 50 ha' | null
          cultures_pratiquees: string[]
          avatar_url: string | null
          profil_verifie: boolean
          derniere_connexion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nom_complet: string
          nom_societe?: string | null
          telephone?: string | null
          email?: string | null
          whatsapp?: string | null
          bio?: string | null
          adresse?: string | null
          langue_preferee?: 'Hausa' | 'Anglais' | 'Français' | null
          etat?: string | null
          lga?: string | null
          village_quartier?: string | null
          coordonnees_gps?: string | null
          sexe?: 'Homme' | 'Femme' | 'Préfère ne pas dire' | null
          age_fourchette?: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+' | null
          type_agriculteur?: 'petit_exploitant' | 'moyen_exploitant' | 'grand_exploitant' | 'cooperative' | null
          type_utilisateur?: (
            | 'producteur'
            | 'acheteur'
            | 'prestataire_service'
            | 'agent'
            | 'cooperative'
            | 'transformateur'
          )[] | null
          superficie_exploitation?: number | null
          superficie_fourchette?: 'Moins de 1 ha' | '1-3 ha' | '3-10 ha' | '10-50 ha' | 'Plus de 50 ha' | null
          cultures_pratiquees?: string[]
          avatar_url?: string | null
          profil_verifie?: boolean
          derniere_connexion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom_complet?: string
          nom_societe?: string | null
          telephone?: string | null
          email?: string | null
          whatsapp?: string | null
          bio?: string | null
          adresse?: string | null
          langue_preferee?: 'Hausa' | 'Anglais' | 'Français' | null
          etat?: string | null
          lga?: string | null
          village_quartier?: string | null
          coordonnees_gps?: string | null
          sexe?: 'Homme' | 'Femme' | 'Préfère ne pas dire' | null
          age_fourchette?: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+' | null
          type_agriculteur?: 'petit_exploitant' | 'moyen_exploitant' | 'grand_exploitant' | 'cooperative' | null
          type_utilisateur?: (
            | 'producteur'
            | 'acheteur'
            | 'prestataire_service'
            | 'agent'
            | 'cooperative'
            | 'transformateur'
          )[] | null
          superficie_exploitation?: number | null
          superficie_fourchette?: 'Moins de 1 ha' | '1-3 ha' | '3-10 ha' | '10-50 ha' | 'Plus de 50 ha' | null
          cultures_pratiquees?: string[]
          avatar_url?: string | null
          profil_verifie?: boolean
          derniere_connexion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories_produits: {
        Row: {
          id: string
          nom: string
          description: string | null
          icone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          description?: string | null
          icone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
          description?: string | null
          icone?: string | null
          created_at?: string
        }
      }
      annonces: {
        Row: {
          id: string
          titre: string
          description: string | null
          prix: number
          unite_prix: string
          quantite_disponible: string
          categorie_id: string | null
          vendeur_id: string
          statut: 'disponible' | 'vendu' | 'suspendu'
          images: string[]
          localisation: string | null
          date_publication: string
          date_expiration: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titre: string
          description?: string | null
          prix: number
          unite_prix?: string
          quantite_disponible: string
          categorie_id?: string | null
          vendeur_id: string
          statut?: 'disponible' | 'vendu' | 'suspendu'
          images?: string[]
          localisation?: string | null
          date_publication?: string
          date_expiration?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titre?: string
          description?: string | null
          prix?: number
          unite_prix?: string
          quantite_disponible?: string
          categorie_id?: string | null
          vendeur_id?: string
          statut?: 'disponible' | 'vendu' | 'suspendu'
          images?: string[]
          localisation?: string | null
          date_publication?: string
          date_expiration?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      etats_nigeria: {
        Row: {
          id: string
          nom: string
          code: string
          region: string
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          code: string
          region: string
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
          code?: string
          region?: string
          created_at?: string
        }
      }
      cultures_disponibles: {
        Row: {
          id: string
          nom: string
          categorie: string
          saison: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          categorie: string
          saison?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
          categorie?: string
          saison?: string | null
          description?: string | null
          created_at?: string
        }
      }
      categories_equipements: {
        Row: {
          id: string
          nom: string
          description: string | null
          icone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          description?: string | null
          icone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
          description?: string | null
          icone?: string | null
          created_at?: string
        }
      }
      equipements: {
        Row: {
          id: string
          nom: string
          description: string | null
          prix_jour: number
          prix_semaine: number | null
          prix_mois: number | null
          devise: string
          categorie_id: string | null
          proprietaire_id: string
          statut: 'disponible' | 'loue' | 'maintenance' | 'suspendu'
          images: string[]
          localisation: string | null
          zone_service: string | null
          coordonnees_gps: string | null
          disponibilite_debut: string | null
          disponibilite_fin: string | null
          caracteristiques: Json
          conditions_location: string | null
          note_moyenne: number
          nombre_evaluations: number
          date_publication: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          description?: string | null
          prix_jour: number
          prix_semaine?: number | null
          prix_mois?: number | null
          devise?: string
          categorie_id?: string | null
          proprietaire_id: string
          statut?: 'disponible' | 'loue' | 'maintenance' | 'suspendu'
          images?: string[]
          localisation?: string | null
          zone_service?: string | null
          coordonnees_gps?: string | null
          disponibilite_debut?: string | null
          disponibilite_fin?: string | null
          caracteristiques?: Json
          conditions_location?: string | null
          note_moyenne?: number
          nombre_evaluations?: number
          date_publication?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom?: string
          description?: string | null
          prix_jour?: number
          prix_semaine?: number | null
          prix_mois?: number | null
          devise?: string
          categorie_id?: string | null
          proprietaire_id?: string
          statut?: 'disponible' | 'loue' | 'maintenance' | 'suspendu'
          images?: string[]
          localisation?: string | null
          zone_service?: string | null
          coordonnees_gps?: string | null
          disponibilite_debut?: string | null
          disponibilite_fin?: string | null
          caracteristiques?: Json
          conditions_location?: string | null
          note_moyenne?: number
          nombre_evaluations?: number
          date_publication?: string
          created_at?: string
          updated_at?: string
        }
      }
      reservations_equipements: {
        Row: {
          id: string
          equipement_id: string
          locataire_id: string
          date_debut: string
          date_fin: string
          prix_total: number
          statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipement_id: string
          locataire_id: string
          date_debut: string
          date_fin: string
          prix_total: number
          statut?: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipement_id?: string
          locataire_id?: string
          date_debut?: string
          date_fin?: string
          prix_total?: number
          statut?: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      evaluations_equipements: {
        Row: {
          id: string
          equipement_id: string
          evaluateur_id: string
          reservation_id: string | null
          note: number
          commentaire: string | null
          created_at: string
        }
        Insert: {
          id?: string
          equipement_id: string
          evaluateur_id: string
          reservation_id?: string | null
          note: number
          commentaire?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          equipement_id?: string
          evaluateur_id?: string
          reservation_id?: string | null
          note?: number
          commentaire?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}