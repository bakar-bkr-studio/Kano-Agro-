import { useState, useEffect } from 'react';
import { supabase, AnnonceWithProfile } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useUserAnnonces() {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState<AnnonceWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserAnnonces();
    }
  }, [user]);

  const loadUserAnnonces = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
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
        .eq('vendeur_id', user.id)
        .order('date_publication', { ascending: false });

      if (error) throw error;

      setAnnonces(data as AnnonceWithProfile[]);
    } catch (err) {
      console.error('Error loading user annonces:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  return {
    annonces,
    loading,
    error,
    refreshAnnonces: loadUserAnnonces,
  };
}