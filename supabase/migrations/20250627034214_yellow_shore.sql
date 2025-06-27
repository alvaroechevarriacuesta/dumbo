/*
  # Fix chunks table nullable columns

  1. Changes
    - Make `file_id` column nullable in `chunks` table
    - Make `site_id` column nullable in `chunks` table
    - This allows chunks to be associated with either files OR sites, not both

  2. Security
    - Maintain existing constraint that ensures at least one of file_id or site_id is not null
    - No changes to RLS policies needed as chunks table doesn't have RLS enabled
*/

-- Make file_id nullable
ALTER TABLE chunks ALTER COLUMN file_id DROP NOT NULL;

-- Make site_id nullable  
ALTER TABLE chunks ALTER COLUMN site_id DROP NOT NULL;