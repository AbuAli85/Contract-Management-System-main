create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now())
); 