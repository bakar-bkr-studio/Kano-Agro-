import { useState, useEffect } from 'react';
import { supabase, Categorie } from '@/lib/supabase';

export function useCategories() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('categories_produits')
        .select('*')
        .order('nom');

      if (error) {
        throw error;
      }

      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    loadCategories,
  };
}