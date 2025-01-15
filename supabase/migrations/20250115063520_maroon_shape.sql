/*
  # Implement Existing Schema

  1. Tables
    - `guests`
      - `id` (uuid, primary key)
      - `rank` (varchar)
      - `name` (varchar)
      - `status` (varchar)
      - `arrivalLocation` (varchar)

    - `users`
      - `id` (uuid, primary key)
      - `email` (varchar)
      - `role` (varchar)
      - `created_by` (uuid)
      - `created_at` (timestamp)
      - `email_confirmed` (bool)

    - `logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `action` (text)
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank varchar,
  name varchar NOT NULL,
  status varchar,
  "arrivalLocation" varchar
);

-- Create users table (if not using default auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL,
  role varchar,
  created_by uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT now(),
  email_confirmed boolean DEFAULT false
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL,
  timestamp timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policies for guests table
CREATE POLICY "Allow authenticated users to read guests"
  ON guests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert guests"
  ON guests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update guests"
  ON guests
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for users table
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policies for logs table
CREATE POLICY "Users can read their own logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());