/*
  # Fix embedding dimensions mismatch

  1. Changes
    - Update chunks table embedding column from vector(3072) to vector(1536)
    - This matches the dimensions produced by text-embedding-3-small model
    - Recreate the vector index with correct dimensions

  2. Notes
    - This will require dropping and recreating the vector index
    - Any existing chunks data will be preserved
    - The application uses text-embedding-3-small which produces 1536 dimensions
*/

-- Drop the existing vector index
DROP INDEX IF EXISTS idx_chunks_embedding;

-- Update the embedding column to use 1536 dimensions
ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(1536);

-- Recreate the vector index with correct dimensions
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);