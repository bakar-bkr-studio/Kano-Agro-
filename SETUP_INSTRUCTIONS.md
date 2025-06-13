# Database Setup Instructions

The application is failing because the database schema hasn't been applied to your Supabase project yet.

## Steps to Fix:

1. **Open Supabase Studio**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to the "SQL Editor" tab

2. **Apply the Migration**
   - Copy the entire contents of `supabase/migrations/20250611093602_lucky_brook.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify the Schema**
   After running the migration, verify these tables exist in the "Table Editor":
   - `profiles`
   - `categories_produits` 
   - `annonces`

4. **Check Relationships**
   Ensure the foreign key relationships are properly set up:
   - `annonces.vendeur_id` → `profiles.id`
   - `annonces.categorie_id` → `categories_produits.id`

## What the Migration Creates:

- **profiles table**: User profiles with agricultural information
- **categories_produits table**: Product categories (Fruits, Légumes, etc.)
- **annonces table**: Product listings/announcements
- **Row Level Security (RLS)**: Proper security policies
- **Default categories**: Pre-populated product categories

## Alternative Method (if you have Supabase CLI):

If you have the Supabase CLI installed locally:

```bash
supabase db push
```

Once the schema is applied, refresh your application and the errors should be resolved.