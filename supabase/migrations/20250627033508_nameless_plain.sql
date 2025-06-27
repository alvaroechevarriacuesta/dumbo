/*
  # Add metadata column to chunks table

  1. Changes
    - Add `metadata` column to `chunks` table as JSONB type
    - This column will store additional metadata for each chunk

  2. Notes
    - The column is nullable to maintain compatibility with existing data
    - JSONB type allows for efficient storage and querying of JSON data
*/

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS metadata jsonb;