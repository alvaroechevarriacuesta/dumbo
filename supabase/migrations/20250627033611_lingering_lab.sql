/*
  # Update embedding dimension from 3072 to 1536

  1. Changes
    - Update `chunks` table `embedding` column from vector(3072) to vector(1536)
    - This aligns with the text-embedding-3-small model which produces 1536-dimensional embeddings

  2. Notes
    - Uses USING clause to safely convert existing data
    - Any existing embeddings will be truncated/padded as needed during conversion
*/

ALTER TABLE chunks 
ALTER COLUMN embedding TYPE vector(1536) 
USING embedding::vector(1536);