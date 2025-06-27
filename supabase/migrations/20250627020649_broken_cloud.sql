/*
  # Add RLS policies for messages table

  1. Security
    - Enable RLS on messages table (if not already enabled)
    - Add policies for authenticated users to manage their own messages
    - Users can read messages from contexts they own
    - Users can create messages in contexts they own
    - Users can update their own messages
    - Users can delete their own messages

  2. Notes
    - Messages are linked to contexts through context_id
    - Users can only access messages from contexts they own
    - RLS policies ensure data isolation between users
*/

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for reading messages - users can read messages from contexts they own
CREATE POLICY "Users can read messages from own contexts"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contexts 
      WHERE contexts.id = messages.context_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Policy for creating messages - users can create messages in contexts they own
CREATE POLICY "Users can create messages in own contexts"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contexts 
      WHERE contexts.id = messages.context_id 
      AND contexts.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- Policy for updating messages - users can update their own messages
CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for deleting messages - users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);