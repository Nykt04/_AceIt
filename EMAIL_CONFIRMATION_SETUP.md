# Email Confirmation & Auto-Login Fix - Complete Setup Guide

## What Was Broken
1. **RLS Policy Error**: User profile creation failed during signup with error "new row violates row-level security policy"
2. **Manual Profile Creation**: The app was trying to create profiles manually during signup, causing RLS conflicts
3. **Confirmation Flow**: Email confirmation screen showed, but auto-login wasn't triggering

## What's Been Fixed

### 1. Updated AuthService ✅
- Removed manual `createUserProfile()` call from the `signUp()` function
- Profile creation is now handled automatically by a database trigger
- This eliminates RLS policy conflicts

### 2. Database Setup (MANUAL STEP REQUIRED)
- Created proper `public.users` table with RLS policies
- Added database trigger that auto-creates profiles when users sign up
- Study sets table RLS policies are also configured

## Step 1: Update Supabase Database

**CRITICAL**: You must run these SQL queries in your Supabase dashboard for the fix to work.

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** on the left sidebar
4. Click **+ New Query**
5. Copy and paste the SQL from [SUPABASE_FIX.md](./SUPABASE_FIX.md)
6. Run each query block one by one
7. Wait for "Success" message after each query

⚠️ **IMPORTANT**: Run these SQL queries in order. Don't skip any.

## Step 2: Test the Flow

### Test 1: Basic Sign Up & Confirmation
1. Open your app in development mode
2. Go to Sign Up tab
3. Enter a test email: `test.user+123@gmail.com` (use unique number)
4. Enter password: `TestPassword123`
5. Enter name: `Test User`
6. Click "Create Account"
7. You should see the **email confirmation screen** with a spinning loader
8. Open your email inbox
9. Check for confirmation email from Supabase
10. Click the **confirmation link** in the email
11. You should be **automatically logged in** and redirected to the home screen ✅

### Test 2: Verify Profile Created
1. After successful login, open your browser DevTools (or check logs)
2. You should see logs showing:
   ```
   [AuthContext] Auth state changed, session exists: true
   [AuthContext] User logged in: [UUID]
   ```
3. This confirms the auth state changed and user was logged in

### Test 3: Session Persistence
1. After logging in, close the app (or refresh browser)
2. Open the app again
3. You should be automatically logged in (no need to sign up/login again)
4. Your study sets should still be there

## How It Works Now

### Email Verification Flow (Step by Step)

```
┌─────────────────────────────────────────────────────┐
│ 1. User Signs Up                                    │
│    - Email + Password + Name submitted              │
│    - SignUp screen shown                            │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Supabase Creates auth.users Entry                │
│    - User email verified field = false              │
│    - User metadata stores full_name                 │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Database Trigger Fires                           │
│    - Automatically creates public.users profile     │
│    - Links to auth.users via id                     │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Confirmation Email Sent                          │
│    - Supabase sends verification email              │
│    - Contains confirmation link                     │
│    - App shows loading screen                       │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. User Clicks Email Confirmation Link              │
│    - User clicks link in email                      │
│    - Supabase marks email as verified               │
│    - auth.users.email_confirmed_at timestamp set    │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Auth State Changes                               │
│    - onAuthStateChange listener fires               │
│    - AuthContext updates user state                 │
│    - isAuthenticated becomes true                   │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. Auto-Login Triggers                              │
│    - LoginSignupScreen detects user is logged in    │
│    - Confirmation screen disappears                 │
│    - RootNavigator switches to AppStack             │
│    - Home screen is displayed                       │
│    - ✅ SUCCESS                                      │
└─────────────────────────────────────────────────────┘
```

## Key Changes Made

### authService.js
```javascript
// BEFORE: Tried to manually create profile (FAILED due to RLS)
const signUp = async (email, password, fullName) => {
  const { data } = await supabase.auth.signUp({...});
  if (data.user) {
    await createUserProfile(data.user.id, fullName, email); // ❌ RLS ERROR
  }
};

// AFTER: Profile creation is automatic (no RLS conflicts)
const signUp = async (email, password, fullName) => {
  const { data } = await supabase.auth.signUp({...});
  // Note: Profile created automatically via database trigger ✅
  return { user: data.user, error: null };
};
```

## Files Updated
- ✅ `src/services/authService.js` - Removed manual profile creation
- ✅ `SUPABASE_FIX.md` - SQL queries for proper database setup

## Files to Check
- `src/context/AuthContext.js` - Auth state listener (already correct)
- `src/screens/LoginSignupScreen.js` - Confirmation screen (already correct)
- `App.js` - Navigation routing (already correct)

## Troubleshooting

### Issue: Still seeing RLS errors
**Solution**: Make sure you ran ALL SQL queries from SUPABASE_FIX.md, especially:
- The `handle_new_user()` function
- The trigger `on_auth_user_created`

### Issue: Confirmation email not received
**Solution**: 
1. Check Supabase email templates (Settings → Email Templates)
2. Make sure email provider is configured
3. Check spam/promotions folder

### Issue: Confirmation screen never disappears
**Solution**:
1. Check browser console for errors
2. Verify auth listener is running (should see logs)
3. Check if email_confirmed_at is being set in Supabase auth.users table

### Issue: Profile creation still failing
**Solution**:
1. Check Supabase logs for errors
2. Verify `public.users` table exists
3. Verify RLS policies are enabled
4. Verify trigger is running

## Next: What to Do Now

1. **BACKUP**: Before making changes to your database
2. **RUN SQL**: Copy SQL from SUPABASE_FIX.md and run in Supabase
3. **TEST**: Follow "Test the Flow" section above
4. **REPORT**: If you see any errors, check Supabase logs

## Files Reference

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Original setup
- [Supabase Fix Guide](./SUPABASE_FIX.md) - SQL queries to run
- [Auth Service](./src/services/authService.js) - Updated auth logic
