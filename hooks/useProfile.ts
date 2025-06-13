import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface EtatNigeria {
  id: string;
  nom: string;
  code: string;
  region: string;
}

export interface CultureDisponible {
  id: string;
  nom: string;
  categorie: string;
  saison: string | null;
  description: string | null;
}

export function useProfile() {
  const [etats, setEtats] = useState<EtatNigeria[]>([]);
  const [cultures, setCultures] = useState<CultureDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les états
      const { data: etatsData, error: etatsError } = await supabase
        .from('etats_nigeria')
        .select('*')
        .order('nom');

      if (etatsError) throw etatsError;

      // Charger les cultures
      const { data: culturesData, error: culturesError } = await supabase
        .from('cultures_disponibles')
        .select('*')
        .order('categorie, nom');

      if (culturesError) throw culturesError;

      setEtats(etatsData || []);
      setCultures(culturesData || []);
    } catch (err) {
      console.error('Error loading reference data:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getCulturesByCategory = () => {
    const grouped: Record<string, CultureDisponible[]> = {};
    cultures.forEach(culture => {
      if (!grouped[culture.categorie]) {
        grouped[culture.categorie] = [];
      }
      grouped[culture.categorie].push(culture);
    });
    return grouped;
  };

  const getEtatsByRegion = () => {
    const grouped: Record<string, EtatNigeria[]> = {};
    etats.forEach(etat => {
      if (!grouped[etat.region]) {
        grouped[etat.region] = [];
      }
      grouped[etat.region].push(etat);
    });
    return grouped;
  };

  return {
    etats,
    cultures,
    loading,
    error,
    getCulturesByCategory,
    getEtatsByRegion,
    loadReferenceData,
  };
}