import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types pour les données de l'application
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Annonce = Database['public']['Tables']['annonces']['Row'];
export type AnnonceInsert = Database['public']['Tables']['annonces']['Insert'];
export type AnnonceUpdate = Database['public']['Tables']['annonces']['Update'];

export type Categorie = Database['public']['Tables']['categories_produits']['Row'];

// Type pour les annonces avec les données du vendeur
export type AnnonceWithProfile = Annonce & {
  profiles: Profile;
  categories_produits: Categorie;
};