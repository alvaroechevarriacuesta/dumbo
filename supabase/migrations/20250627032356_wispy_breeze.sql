/*
  # Create chunks table for RAG system

  1. New Tables
    - `chunks`
      - `id` (uuid, primary key)
      - `content` (text, the chunk content)
      - `embedding` (vector, the embedding vector)
      - `file_id` (uuid, optional reference to files table)
      - `site_id` (uuid, optional reference to sites table)
      - `metadata` (jsonb, additional metadata)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `chunks` table
    - Add policies for authenticated users to manage chunks through file/site ownership

  3. Indexes
    - Add vector similarity search index
    - Add indexes for file_id and site_id lookups
*/

-- Create the chunks table
CREATE TABLE IF NOT EXISTS chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  
  -- Ensure chunk belongs to either a file or site, but not both
  CONSTRAINT chunks_source_check CHECK (
    (file_id IS NOT NULL AND site_id IS NULL) OR 
    (file_id IS NULL AND site_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_file_id ON chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chunks_site_id ON chunks(site_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);

-- RLS Policies

-- Users can read chunks from files in their contexts
CREATE POLICY "Users can read chunks from own files"
  ON chunks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files 
      JOIN contexts ON files.context_id = contexts.id
      WHERE files.id = chunks.file_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Users can read chunks from sites in their contexts  
CREATE POLICY "Users can read chunks from own sites"
  ON chunks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites 
      JOIN contexts ON sites.context_id = contexts.id
      WHERE sites.id = chunks.site_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Users can insert chunks for files in their contexts
CREATE POLICY "Users can create chunks for own files"
  ON chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files 
      JOIN contexts ON files.context_id = contexts.id
      WHERE files.id = chunks.file_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Users can insert chunks for sites in their contexts
CREATE POLICY "Users can create chunks for own sites"
  ON chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites 
      JOIN contexts ON sites.context_id = contexts.id
      WHERE sites.id = chunks.site_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Users can delete chunks from files in their contexts
CREATE POLICY "Users can delete chunks from own files"
  ON chunks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files 
      JOIN contexts ON files.context_id = contexts.id
      WHERE files.id = chunks.file_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Users can delete chunks from sites in their contexts
CREATE POLICY "Users can delete chunks from own sites"
  ON chunks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites 
      JOIN contexts ON sites.context_id = contexts.id
      WHERE sites.id = chunks.site_id 
      AND contexts.user_id = auth.uid()
    )
  );