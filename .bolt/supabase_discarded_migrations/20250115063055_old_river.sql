/*
  # Guest Management Schema

  1. New Tables
    - `guests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `status` (text) - 'active', 'inactive'
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
  2. Security
    - Enable RLS on `guests` table
    - Add policies for authenticated users to:
      - Read their own guests
      - Create new guests
      - Update their own guests
*/

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own guests
CREATE POLICY "Users can read own guests"
  ON guests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own guests
CREATE POLICY "Users can create guests"
  ON guests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own guests
CREATE POLICY "Users can update own guests"
  ON guests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);