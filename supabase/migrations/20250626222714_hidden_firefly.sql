/*
  # Add content column to files table

  1. New Column
    - Add `content` column to store extracted text from files
    - Add `processing_status` to track file processing state
    - Add `processing_error` to store any processing errors

  2. Indexes
    - Add index on processing_status for efficient queries
    - Add full-text search index on content
*/

-- Add content and processing columns to files table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'content'
  ) THEN
    ALTER TABLE files ADD COLUMN content text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE files ADD COLUMN processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'processing_error'
  ) THEN
    ALTER TABLE files ADD COLUMN processing_error text;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_processing_status ON files(processing_status);

-- Add full-text search index on content (using GIN index for better performance)
CREATE INDEX IF NOT EXISTS idx_files_content_search ON files USING gin(to_tsvector('english', content));