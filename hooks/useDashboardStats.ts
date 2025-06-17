import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface DashboardStats {
  stock_count: number;
  annonces_actives: number;
  ventes_realisees: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    stock_count: 18,
    annonces_actives: 6,
    ventes_realisees: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { count: stockCount, error: stockError } = await supabase
        .from('stocks')
        .select('id', { count: 'exact', head: true })
        .eq('utilisateur_id', user.id);
      if (stockError) throw stockError;

      const { count: annoncesCount, error: annoncesError } = await supabase
        .from('annonces')
        .select('id', { count: 'exact', head: true })
        .eq('vendeur_id', user.id)
        .eq('statut', 'disponible');
      if (annoncesError) throw annoncesError;

      const { count: ventesCount, error: ventesError } = await supabase
        .from('ventes')
        .select('id', { count: 'exact', head: true })
        .eq('vendeur_id', user.id);
      if (ventesError) throw ventesError;

      setStats({
        stock_count: stockCount || 0,
        annonces_actives: annoncesCount || 0,
        ventes_realisees: ventesCount || 0,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refresh: loadStats };
}
