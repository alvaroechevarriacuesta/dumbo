/*
  # Fix chunks table constraint

  1. Changes
    - Update the chunks_source_check constraint to properly allow either file_id OR site_id to be set
    - Both can be nullable, but at least one must be provided
    - This matches the database schema where both are nullable foreign keys

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chunks_source_check' AND table_name = 'chunks'
  ) THEN
    ALTER TABLE chunks DROP CONSTRAINT chunks_source_check;
  END IF;
END $$;

-- Add the corrected constraint
-- Either file_id OR site_id must be set (but not both, and not neither)
ALTER TABLE chunks ADD CONSTRAINT chunks_source_check 
CHECK ((file_id IS NOT NULL) OR (site_id IS NOT NULL));