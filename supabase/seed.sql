-- Create test users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'test1', 'authenticated', 'authenticated', 'test1@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'test2', 'authenticated', 'authenticated', 'test2@example.com', crypt('password123', gen_salt('bf')), now(), now(), now());

-- Insert into auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
) VALUES
  ('test1', 'test1', jsonb_build_object('sub', 'test1'), 'email', now(), now()),
  ('test2', 'test2', jsonb_build_object('sub', 'test2'), 'email', now(), now()); 