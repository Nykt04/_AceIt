# Supabase Fix: Email Confirmation & User Profile RLS

## Problem
- User profile creation fails during signup with RLS policy error
- Email confirmation screen appears but auto-login doesn't trigger
- Error: "new row violates row-level security policy for table 'users'"

## Solution

Run these SQL queries in your Supabase SQL Editor to fix the issue:

### 1. Create the public.users table
```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 2. Enable RLS on users table
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### 3. Create RLS Policies for users table

**Allow users to read their own profile:**
```sql
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);
```

**Allow service role to create profiles (for signups):**
```sql
CREATE POLICY "Service role can create profiles"
  ON public.users FOR INSERT
  WITH CHECK (true);
```

**Allow users to update their own profile:**
```sql
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

### 4. Create a function to handle profile creation after email confirmation
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    now(),
    now()
  );
  RETURN new;
END;
$$ language plpgsql security definer;
```

### 5. Create a trigger to call the function when auth.users is created
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Fix the existing study_sets RLS (if needed)
```sql
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study sets"
  ON public.study_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create study sets"
  ON public.study_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sets"
  ON public.study_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sets"
  ON public.study_sets FOR DELETE
  USING (auth.uid() = user_id);
```

## Steps to Apply

1. Go to your Supabase project dashboard
2. Click **SQL Editor** on the left sidebar
3. Click **New Query**
4. Copy and paste each SQL block above
5. Click **Run**
6. Wait for completion

## How It Works Now

1. User signs up → auth.users entry is created
2. Trigger automatically creates public.users profile
3. Email confirmation email is sent
4. User clicks confirmation link
5. Email is verified in auth.users
6. AuthContext listener detects auth state change
7. Auto-login happens automatically

## Test It

1. Run your app
2. Sign up with a new email
3. You should see the confirmation screen
4. Click the email verification link
5. You should be automatically logged in (confirmation screen disappears, user redirected to home)
