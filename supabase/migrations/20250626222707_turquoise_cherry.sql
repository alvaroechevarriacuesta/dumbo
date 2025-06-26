/*
  # Storage Setup for File Upload System

  1. Storage Configuration
    - Create storage bucket for files
    - Set up RLS policies for secure access
    - Configure file type and size restrictions

  2. Security
    - Enable RLS on storage bucket
    - Add policies for authenticated users to upload/read their own files
    - Restrict file types to .txt and .pdf only
*/

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  false,
  10485760, -- 10MB limit
  ARRAY['text/plain', 'application/pdf']
);

-- Enable RLS on storage bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);