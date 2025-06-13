import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

      if (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      } else {
        console.log('Profile loaded:', data?.nom_complet);
        setProfile(data); // data will be null if no profile exists
        
        // Update last connection time if profile exists
        if (data) {
          await supabase
            .from('profiles')
            .update({ derniere_connexion: new Date().toISOString() })
            .eq('id', userId);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { data, error };
      }
      
      console.log('Sign in successful for:', email);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { data: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, profileData: {
    nom_complet: string;
    telephone?: string | null;
    adresse?: string | null;
  }) => {
    try {
      console.log('Attempting sign up for:', email);
      
      // First, create the user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error);
        return { data, error };
      }

      if (data.user && !error) {
        console.log('User created, creating profile...');
        
        // Create profile with proper data structure
        const profileInsert = {
          id: data.user.id,
          nom_complet: profileData.nom_complet,
          telephone: profileData.telephone,
          adresse: profileData.adresse,
          // Set default values for required fields
          langue_preferee: 'Hausa' as const,
          type_utilisateur: 'producteur' as const,
          cultures_pratiquees: [],
          profil_verifie: false,
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileInsert);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Return error if profile creation fails
          return { 
            data, 
            error: new Error('Échec de la création du profil. Veuillez réessayer.') 
          };
        }
        
        console.log('Profile created successfully');
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...');
      
      // Clear local state first
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return { error };
      }
      
      console.log('Successfully signed out');
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      return { error: error instanceof Error ? error : new Error('Erreur lors de la déconnexion') };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('Updating profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (!error && data) {
        console.log('Profile updated successfully');
        setProfile(data);
      }

      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: error as Error };
    }
  };

  const createProfileIfMissing = async (profileData: any) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('Creating profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          ...profileData,
        })
        .select()
        .single();

      if (!error && data) {
        console.log('Profile created successfully');
        setProfile(data);
      }

      return { data, error };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { data: null, error: error as Error };
    }
  };

  return {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    createProfileIfMissing,
  };
}