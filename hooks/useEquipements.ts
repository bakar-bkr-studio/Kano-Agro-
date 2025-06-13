import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface EquipementCategory {
  id: string;
  nom: string;
  description: string | null;
  icone: string | null;
  created_at: string;
}

export interface Equipement {
  id: string;
  nom: string;
  description: string | null;
  prix_jour: number;
  prix_semaine: number | null;
  prix_mois: number | null;
  devise: string;
  categorie_id: string | null;
  proprietaire_id: string;
  statut: 'disponible' | 'loue' | 'maintenance' | 'suspendu';
  images: string[];
  localisation: string | null;
  zone_service: string | null;
  coordonnees_gps: string | null;
  disponibilite_debut: string | null;
  disponibilite_fin: string | null;
  caracteristiques: any;
  conditions_location: string | null;
  note_moyenne: number;
  nombre_evaluations: number;
  date_publication: string;
  created_at: string;
  updated_at: string;
  // Relations
  categories_equipements?: EquipementCategory;
  profiles?: {
    nom_complet: string;
    telephone: string | null;
    etat: string | null;
  };
}

export interface EquipementInsert {
  nom: string;
  description?: string;
  prix_jour: number;
  prix_semaine?: number;
  prix_mois?: number;
  devise?: string;
  categorie_id?: string;
  images?: string[];
  localisation?: string;
  zone_service?: string;
  coordonnees_gps?: string;
  disponibilite_debut?: string;
  disponibilite_fin?: string;
  caracteristiques?: any;
  conditions_location?: string;
}

export interface Reservation {
  id: string;
  equipement_id: string;
  locataire_id: string;
  date_debut: string;
  date_fin: string;
  prix_total: number;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  message: string | null;
  created_at: string;
  updated_at: string;
}

export function useEquipements() {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [categories, setCategories] = useState<EquipementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadEquipements();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories_equipements')
        .select('*')
        .order('nom');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading equipment categories:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des catégories');
    }
  };

  const loadEquipements = async (filters?: {
    categorie?: string;
    search?: string;
    localisation?: string;
    maxDistance?: number;
    userLocation?: { latitude: number; longitude: number };
  }) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('equipements')
        .select(`
          *,
          categories_equipements:categorie_id (
            nom,
            icone
          ),
          profiles:proprietaire_id (
            nom_complet,
            telephone,
            etat
          )
        `)
        .eq('statut', 'disponible')
        .order('date_publication', { ascending: false });

      // Apply filters
      if (filters?.categorie && filters.categorie !== 'all') {
        query = query.eq('categorie_id', filters.categorie);
      }

      if (filters?.search) {
        query = query.or(`nom.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.localisation) {
        query = query.ilike('localisation', `%${filters.localisation}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEquipements(data as Equipement[]);
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des équipements');
    } finally {
      setLoading(false);
    }
  };

  const createEquipement = async (equipementData: EquipementInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('equipements')
        .insert({
          ...equipementData,
          proprietaire_id: user.id,
        })
        .select(`
          *,
          categories_equipements:categorie_id (
            nom,
            icone
          ),
          profiles:proprietaire_id (
            nom_complet,
            telephone,
            etat
          )
        `)
        .single();

      if (error) throw error;

      // Add to local state
      setEquipements(prev => [data as Equipement, ...prev]);
      
      return { data, error: null };
    } catch (err) {
      console.error('Error creating equipment:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création de l\'annonce' 
      };
    }
  };

  const updateEquipement = async (id: string, updates: Partial<EquipementInsert>) => {
    try {
      const { data, error } = await supabase
        .from('equipements')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          categories_equipements:categorie_id (
            nom,
            icone
          ),
          profiles:proprietaire_id (
            nom_complet,
            telephone,
            etat
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setEquipements(prev => 
        prev.map(equipement => 
          equipement.id === id ? data as Equipement : equipement
        )
      );

      return { data, error: null };
    } catch (err) {
      console.error('Error updating equipment:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' 
      };
    }
  };

  const deleteEquipement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setEquipements(prev => prev.filter(equipement => equipement.id !== id));

      return { error: null };
    } catch (err) {
      console.error('Error deleting equipment:', err);
      return { 
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression' 
      };
    }
  };

  const createReservation = async (reservationData: {
    equipement_id: string;
    date_debut: string;
    date_fin: string;
    prix_total: number;
    message?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('reservations_equipements')
        .insert({
          ...reservationData,
          locataire_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null };
    } catch (err) {
      console.error('Error creating reservation:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la réservation' 
      };
    }
  };

  const getUserReservations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('reservations_equipements')
        .select(`
          *,
          equipements (
            nom,
            images,
            prix_jour
          )
        `)
        .eq('locataire_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data, error: null };
    } catch (err) {
      console.error('Error loading reservations:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors du chargement des réservations' 
      };
    }
  };

  return {
    equipements,
    categories,
    loading,
    error,
    loadEquipements,
    createEquipement,
    updateEquipement,
    deleteEquipement,
    createReservation,
    getUserReservations,
  };
}