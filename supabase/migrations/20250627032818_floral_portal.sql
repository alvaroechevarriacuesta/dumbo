/*
  # Add file_id column to chunks table

  1. Schema Changes
    - Add `file_id` column to `chunks` table as UUID with foreign key to `files` table
    - Add index on `file_id` for better query performance
    - Update existing chunks to have null file_id (they will be re-processed)

  2. Security
    - No RLS changes needed as chunks table inherits security through file relationships

  3. Notes
    - This migration adds the missing file_id column that the application expects
    - Existing chunks will have null file_id and should be re-processed
*/

-- Add file_id column to chunks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chunks' AND column_name = 'file_id'
  ) THEN
    ALTER TABLE chunks ADD COLUMN file_id uuid;
  END IF;
END $$;

-- Add foreign key constraint to files table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chunks_file_id_fkey'
  ) THEN
    ALTER TABLE chunks ADD CONSTRAINT chunks_file_id_fkey 
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index on file_id for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_chunks_file_id'
  ) THEN
    CREATE INDEX idx_chunks_file_id ON chunks(file_id);
  END IF;
END $$;

-- Add check constraint to ensure either file_id or site_id is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chunks_source_check'
  ) THEN
    ALTER TABLE chunks ADD CONSTRAINT chunks_source_check 
    CHECK (file_id IS NOT NULL OR site_id IS NOT NULL);
  END IF;
END $$;