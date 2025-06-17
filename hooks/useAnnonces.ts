import { useState, useEffect } from 'react';
import { supabase, Annonce, AnnonceWithProfile, AnnonceInsert, AnnonceUpdate } from '@/lib/supabase';

export function useAnnonces() {
  const [annonces, setAnnonces] = useState<AnnonceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnnonces = async (filters?: {
    categorie?: string;
    search?: string;
    vendeur?: string;
    statut?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('annonces')
        .select(`
          *,
          profiles:vendeur_id (
            nom_complet,
            telephone,
            adresse
          ),
          categories_produits:categorie_id (
            nom,
            icone
          )
        `)
        .order('date_publication', { ascending: false });

      // Apply filters
      if (filters?.statut) {
        query = query.eq('statut', filters.statut);
      } else {
        query = query.eq('statut', 'disponible');
      }

      if (filters?.categorie && filters.categorie !== 'all') {
        query = query.eq('categorie_id', filters.categorie);
      }

      if (filters?.vendeur) {
        query = query.eq('vendeur_id', filters.vendeur);
      }

      if (filters?.search) {
        query = query.or(`titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAnnonces(data as AnnonceWithProfile[]);
    } catch (err) {
      console.error('Error loading annonces:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const createAnnonce = async (annonceData: Omit<AnnonceInsert, 'vendeur_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('annonces')
        .insert({
          ...annonceData,
          vendeur_id: user.id,
        })
        .select(`
          *,
          profiles:vendeur_id (
            nom_complet,
            telephone,
            adresse
          ),
          categories_produits:categorie_id (
            nom,
            icone
          )
        `)
        .single();

      if (error) throw error;

      // Add to local state
      setAnnonces(prev => [data as AnnonceWithProfile, ...prev]);
      
      return { data, error: null };
    } catch (err) {
      console.error('Error creating annonce:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création de l\'annonce' 
      };
    }
  };

  const updateAnnonce = async (id: string, updates: AnnonceUpdate) => {
    try {
      const { data, error } = await supabase
        .from('annonces')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          profiles:vendeur_id (
            nom_complet,
            telephone,
            adresse
          ),
          categories_produits:categorie_id (
            nom,
            icone
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setAnnonces(prev => 
        prev.map(annonce => 
          annonce.id === id ? data as AnnonceWithProfile : annonce
        )
      );

      return { data, error: null };
    } catch (err) {
      console.error('Error updating annonce:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'annonce' 
      };
    }
  };

  const deleteAnnonce = async (id: string) => {
    try {
      const { error } = await supabase
        .from('annonces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setAnnonces(prev => prev.filter(annonce => annonce.id !== id));

      return { error: null };
    } catch (err) {
      console.error('Error deleting annonce:', err);
      return { 
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'annonce' 
      };
    }
  };

  useEffect(() => {
    loadAnnonces();
  }, []);

  return {
    annonces,
    loading,
    error,
    loadAnnonces,
    createAnnonce,
    updateAnnonce,
    deleteAnnonce,
  };
}