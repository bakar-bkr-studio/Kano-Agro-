/*
  # Fix RLS Policy for Profile Creation

  1. Security Updates
    - Drop existing INSERT policy that uses incorrect uid() function
    - Create new INSERT policy using correct auth.uid() function
    - Ensure users can create their own profiles after signup

  2. Policy Changes
    - Replace "Les utilisateurs peuvent créer leur propre profil" policy
    - Use proper auth.uid() = id condition for both USING and WITH CHECK
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON profiles;

-- Create a new INSERT policy with the correct auth function
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure the UPDATE policy uses the correct function
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure the SELECT policy is also correct
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir tous les profils publics" ON profiles;

CREATE POLICY "Users can view all public profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);