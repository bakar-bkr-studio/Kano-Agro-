import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface UserStats {
  annonces_publiees: number;
  ventes_realisees: number;
  achats_effectues: number;
  derniere_connexion: string | null;
  membre_depuis: string;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    annonces_publiees: 0,
    ventes_realisees: 0,
    achats_effectues: 0,
    derniere_connexion: null,
    membre_depuis: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Charger les statistiques des annonces
      const { data: annoncesData, error: annoncesError } = await supabase
        .from('annonces')
        .select('id, statut')
        .eq('vendeur_id', user.id);

      if (annoncesError) throw annoncesError;

      // Calculer les statistiques
      const annonces_publiees = annoncesData?.length || 0;
      const ventes_realisees = annoncesData?.filter(a => a.statut === 'vendu').length || 0;

      // Charger les informations du profil pour la date de création et dernière connexion
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('created_at, derniere_connexion')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Pour les achats, on pourrait créer une table séparée ou utiliser une logique différente
      // Pour l'instant, on simule avec 0 car il n'y a pas de table d'achats dans le schéma actuel
      const achats_effectues = 0;

      setStats({
        annonces_publiees,
        ventes_realisees,
        achats_effectues,
        derniere_connexion: profileData?.derniere_connexion || null,
        membre_depuis: profileData?.created_at || user.created_at,
      });

    } catch (err) {
      console.error('Error loading user stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refreshStats: loadUserStats,
  };
}