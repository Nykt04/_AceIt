import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native'; // ← ADD THIS

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Auth will not work.');
}

// ← ADD THIS
const storage = Platform.OS === 'web' ? {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
} : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storage, // ← use storage variable
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});


  export const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Note: User profile is now automatically created via database trigger
      // when the auth.users entry is created. No need to create it manually.

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  /**
   * Sign in with email and password
   */
  export const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      return { user: null, session: null, error: error.message };
    }
  };

  /**
   * Sign out current user
   */
  export const signOut = async () => {
    try {
      console.log('[authService] ===== SIGN OUT START =====');
      console.log('[authService] Step 1: Checking current session...');
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('[authService] Current session before signOut:', !!currentSession);
      
      // CRITICAL: Clear all session storage BEFORE calling signOut
      // This prevents Supabase from restoring the session from storage after signing out
      console.log('[authService] Step 2: Clearing auth storage to prevent auto-restore...');
      
      if (Platform.OS === 'web') {
        // Clear localStorage for web
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-')) {
            console.log('[authService] Removing localStorage key:', key);
            localStorage.removeItem(key);
          }
        });
      } else {
        // Clear AsyncStorage for React Native
        const keys = await AsyncStorage.getAllKeys();
        const supabaseKeys = keys.filter(k => k.startsWith('sb-'));
        if (supabaseKeys.length > 0) {
          console.log('[authService] Removing AsyncStorage keys:', supabaseKeys.length);
          await AsyncStorage.multiRemove(supabaseKeys);
        }
      }
      
      // NOW call signOut after storage is cleared
      console.log('[authService] Step 3: Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      console.log('[authService] Sign out response - error:', error);
      
      if (error) {
        console.error('[authService] Sign out error:', error.message);
        throw error;
      }
      
      console.log('[authService] Verifying session after signOut...');
      const { data: { session: sessionAfter } } = await supabase.auth.getSession();
      console.log('[authService] Session after signOut:', !!sessionAfter);
      
      console.log('[authService] User signed out successfully');
      console.log('[authService] ===== SIGN OUT END =====');
      return { error: null };
    } catch (error) {
      console.error('[authService] Sign out exception:', error);
      console.log('[authService] ===== SIGN OUT END (WITH ERROR) =====');
      return { error: error.message };
    }
  };

  /**
   * Force clear all authentication data
   */
  export const forceLogout = async () => {
    try {
      console.log('[authService] Force logging out and clearing session...');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear the session from Supabase local storage
      const { error } = await supabase.auth.refreshSession();
      
      console.log('[authService] Session cleared');
      return { error: null };
    } catch (error) {
      console.error('[authService] Force logout error:', error.message);
      return { error: error.message };
    }
  };

  /**
   * Get current user session
   */
  export const getCurrentSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error: error.message };
    }
  };

  /**
   * Get current authenticated user
   */
  export const getCurrentUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  /**
   * Create user profile in public.users table
   */
  export const createUserProfile = async (userId, fullName, email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email,
            full_name: fullName,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.log('User profile creation error:', error.message);
      return { data: null, error: error.message };
    }
  };

  /**
   * Get user profile
   */
  export const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error: error.message };
    }
  };

  /**
   * Sign in with Google OAuth
   */
  export const signInWithGoogle = async () => {
    try {
      console.log('[authService] Starting Google OAuth sign-in...');
      
      if (Platform.OS === 'web') {
        // For web, use Supabase OAuth redirect
        const redirectTo = `${window.location.origin}/`;
        console.log('[authService] Redirect URL:', redirectTo);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectTo,
            skipBrowserRedirect: false,
          },
        });

        if (error) {
          console.error('[authService] Google OAuth error:', error);
          throw error;
        }

        console.log('[authService] Google OAuth initiated');
        return { data, error: null };
      } else {
        // For React Native, would need @react-native-google-signin/google-signin
        throw new Error('Google sign-in not configured for native platforms');
      }
    } catch (error) {
      console.error('[authService] Google sign-in error:', error.message);
      return { data: null, error: error.message };
    }
  };

  /**
   * Delete user account and all associated data
   */
  export const deleteAccount = async (userId) => {
    try {
      console.log('[authService] Starting account deletion for user:', userId);

      // Delete all study sets for this user first (due to foreign key constraints)
      const { error: setsError } = await supabase
        .from('study_sets')
        .delete()
        .eq('user_id', userId);
      
      if (setsError) {
        console.error('[authService] Error deleting study sets:', setsError);
        throw new Error(`Failed to delete study sets: ${setsError.message}`);
      }
      console.log('[authService] Study sets deleted successfully');

      // Delete user profile
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('[authService] Error deleting user profile:', profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }
      console.log('[authService] User profile deleted successfully');

      return { error: null };
    } catch (error) {
      console.error('[authService] Delete account error:', error.message);
      return { error: error.message };
    }
  };

  /**
   * Listen to auth state changes
   */
  export const onAuthStateChange = (callback) => {
    console.log('[authService] Setting up auth state change listener...');
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[authService] ===== AUTH STATE CHANGE EVENT =====');
      console.log('[authService] Event:', event);
      console.log('[authService] Session:', !!session);
      console.log('[authService] User:', !!session?.user);
      
      if (event === 'SIGNED_OUT') {
        console.log('[authService] SIGNED_OUT detected - passing null to callback');
        callback(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log('[authService] Auth event:', event, '- passing session to callback');
        callback(session);
      } else {
        console.log('[authService] Other event:', event);
        callback(session);
      }
      console.log('[authService] ===== END EVENT =====');
    });

    return data?.subscription;
  };

  /**
   * Send password reset email
   */
  export const resetPassword = async (email) => {
    try {
      const redirectTo = Platform.OS === 'web' 
        ? `${window.location.origin}/reset-password`
        : `${process.env.EXPO_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  /**
   * Send welcome email to new user after OAuth signup
   */
  export const sendWelcomeEmail = async (email, fullName) => {
    try {
      console.log('[authService] Sending welcome email to:', email);
      
      // Call Supabase Edge Function to send welcome email
      // You can also use Supabase's sendEmail if configured
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          fullName: fullName || email.split('@')[0],
        },
      });

      if (error) {
        console.warn('[authService] Edge function not available, skipping welcome email:', error.message);
        // Edge function not configured is not critical, just log and continue
        return { error: null };
      }

      console.log('[authService] Welcome email sent successfully');
      return { error: null };
    } catch (error) {
      console.warn('[authService] Welcome email error (non-critical):', error.message);
      // Email failures are not critical, don't block user login
      return { error: null };
    }
  };

  /**
   * Refresh user data from Supabase
   * Checks if user profile still exists and clears session if deleted
   */
  export const refreshUserData = async () => {
    try {
      console.log('[authService] Refreshing user data...');
      
      // Get current user from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[authService] Error getting user:', userError.message);
        return { user: null, error: userError.message };
      }

      if (!user) {
        console.log('[authService] No authenticated user found');
        return { user: null, error: null };
      }

      // Verify user profile exists in database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // PGRST116 = no rows found (user was deleted)
        if (profileError.code === 'PGRST116') {
          console.log('[authService] User profile not found. User was deleted from database.');
          return { user: null, profile: null, error: 'User profile was deleted' };
        }
        // Other errors
        console.error('[authService] Error checking profile:', profileError.message);
        return { user, profile: null, error: profileError.message };
      }

      if (!profile) {
        console.log('[authService] User profile data is null. User was deleted.');
        return { user: null, profile: null, error: 'User profile was deleted' };
      }

      console.log('[authService] User data refreshed successfully');
      return { user, profile, error: null };
    } catch (error) {
      console.error('[authService] Refresh user data error:', error.message);
      return { user: null, profile: null, error: error.message };
    }
  };

  /**
   * Handle email confirmation token from URL
   * Automatically verifies OTP when user clicks email confirmation link
   */
  export const handleEmailConfirmationToken = async () => {
    try {
      if (Platform.OS !== 'web') {
        console.log('[authService] Email token handling only supported on web');
        return { error: null }; // Not applicable for mobile
      }

      console.log('[authService] Checking for email confirmation token in URL...');
      
      // Supabase stores the token in the URL hash
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const tokenType = params.get('type');

      if (!accessToken) {
        console.log('[authService] No token found in URL');
        return { error: null };
      }

      console.log('[authService] Found token in URL, type:', tokenType);

      // Create a new session with the token
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('[authService] Error verifying email token:', error.message);
        return { error: error.message };
      }

      console.log('[authService] Email confirmation verified successfully!');
      console.log('[authService] User:', data.user?.email);

      // Clean up the URL by removing the hash
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('[authService] Email token handling error:', error.message);
      return { error: error.message };
    }
  };
