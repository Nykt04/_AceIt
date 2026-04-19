# AceIt Authentication Setup Guide

## ✅ What's Been Implemented

1. **Supabase Authentication Service** (`src/services/authService.js`)
   - Email/password signup
   - Email/password login
   - Session management
   - User profile creation

2. **AuthContext** (`src/context/AuthContext.js`)
   - Global authentication state
   - `useAuth()` hook for components
   - Auto-login on app restart

3. **Route Protection** (Updated `App.js`)
   - Shows LoginSignup screen if not authenticated
   - Shows main app if authenticated
   - Automatic route switching

4. **Cloud Storage** (Updated `src/services/storageService.js`)
   - Study sets sync to Supabase per user
   - Falls back to local storage if offline
   - All operations work on both platforms

5. **Updated LoginSignupScreen**
   - Real email/password authentication
   - Form validation
   - Error handling

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click **"New Project"**
3. Enter project details and wait for creation

### Step 2: Get API Credentials
1. Go to **Settings → API**
2. Copy **Project URL** and **Anon Key (public)**
3. Update `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key...
```

### Step 3: Create Database Tables
In Supabase, go to **SQL Editor** and run:

```sql
-- Create study_sets table
CREATE TABLE study_sets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  terms JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_study_sets_user_id ON study_sets(user_id);

-- Enable Row Level Security (important for privacy!)
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;

-- Create policies (so users can only see their own data)
CREATE POLICY "Users can view their own study sets"
  ON study_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create study sets"
  ON study_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sets"
  ON study_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sets"
  ON study_sets FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 4: Deploy to Vercel
Add these environment variables to your Vercel project:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SITE_URL` = your deployed URL (e.g., https://aceit.vercel.app)

---

## 🧪 Testing Locally

```bash
npm start
```

Then:
1. **Sign Up** with a test email
2. Check Supabase Dashboard → **Authentication → Users** (should see new user)
3. Create a study set
4. Check Supabase Dashboard → **study_sets table** (should see your data)
5. Log out and log back in (study sets should still be there!)

---

## 📱 How It Works

### Authentication Flow
```
User Opens App
    ↓
AuthContext checks session
    ├─ If Authenticated → Show App (Home, About, etc.)
    └─ If Not Authenticated → Show LoginSignup
        ├─ User enters email & password
        ├─ Supabase validates credentials
        └─ User is logged in → App loads
```

### Data Storage Flow
```
User Creates Study Set
    ↓
Local Storage Updated (immediate)
    ↓
If User is Authenticated → Sync to Supabase (per-user)
    ↓
If Network Error → Continue using local data
```

---

## 🔒 Security Features

- ✅ **Row Level Security (RLS)** - Users can only access their own data
- ✅ **API Keys** - Never exposed in client code
- ✅ **Session Persistence** - Secure token management
- ✅ **Password Hashing** - Supabase handles encryption

---

## 🎯 Usage in Components

### Check if user is logged in:
```javascript
import { useAuth } from './src/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Text>Hello {user.email}</Text> : null;
}
```

### Log out:
```javascript
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut();
  // User is automatically redirected to LoginSignup
};
```

---

## ❓ Troubleshooting

**"Auth not working"**
- Check `.env` has correct Supabase credentials
- Verify Supabase project is active

**"Study sets not syncing to Supabase"**
- Make sure user is authenticated
- Check Row Level Security policies are set
- Check network connection

**"Getting CORS errors"**
- Make sure `EXPO_PUBLIC_SUPABASE_URL` is correct
- Supabase should handle CORS automatically

---

## 📚 Next Steps

- [ ] Add Google Sign-In
- [ ] Add password reset email
- [ ] Add user profile page
- [ ] Add study set sharing between users
- [ ] Add offline sync queue

---

## 📖 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
