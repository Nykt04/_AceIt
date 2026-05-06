import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getCurrentUser, signOut as authSignOut, getCurrentSession, handleEmailConfirmationToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    let subscription;

    // Initialize auth state
    (async () => {
      try {
        console.log('[AuthContext] Initializing auth state...');
        
        // Handle email confirmation token if present in URL (web only)
        console.log('[AuthContext] Checking for email confirmation token...');
        const { error: tokenError } = await handleEmailConfirmationToken();
        if (tokenError) {
          console.warn('[AuthContext] Email token handling error (non-critical):', tokenError);
        }
        
        // Check if user has completed onboarding
        const onboarding = await AsyncStorage.getItem('@onboarding_complete');
        console.log('[AuthContext] Onboarding status:', !!onboarding);
        if (onboarding && mounted) {
          setOnboardingComplete(true);
        }
        
        // First, get the current session from Supabase
        const { session: currentSession, error: sessionError } = await getCurrentSession();
        console.log('[AuthContext] Current session:', !!currentSession);
        
        if (currentSession && mounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          console.log('[AuthContext] User initialized from session:', currentSession.user?.id);
        } else if (mounted) {
          setSession(null);
          setUser(null);
        }
        
        // Set up listener for auth state changes
        console.log('[AuthContext] Setting up auth listener...');
        subscription = onAuthStateChange((newSession) => {
          console.log('[AuthContext] Auth state changed, session exists:', !!newSession, 'user:', !!newSession?.user);
          if (mounted) {
            setSession(newSession);
            if (newSession?.user) {
              setUser(newSession.user);
              console.log('[AuthContext] User logged in:', newSession.user.id);
            } else {
              setUser(null);
              console.log('[AuthContext] User logged out');
            }
          }
        });
        console.log('[AuthContext] Auth listener set up');
        
      } catch (err) {
        console.error('[AuthContext] Setup error:', err);
        if (mounted) {
          setError(err.message);
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          console.log('[AuthContext] Loading complete');
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('[AuthContext] ===== SIGN OUT INITIATED =====');
      console.log('[AuthContext] Current user before logout:', user?.id);
      setError(null);
      
      // Immediately clear local UI state
      console.log('[AuthContext] Step 1: Clearing user and session state from UI');
      setUser(null);
      setSession(null);
      
      // Sign out from Supabase
      console.log('[AuthContext] Step 2: Calling authSignOut...');
      const { error: signOutError } = await authSignOut();
      if (signOutError) {
        console.error('[AuthContext] Supabase sign out error:', signOutError);
        throw signOutError;
      }
      
      // Clear local storage
      console.log('[AuthContext] Step 3: Clearing local storage...');
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(k => k.startsWith('sb-'));
      if (supabaseKeys.length > 0) {
        console.log('[AuthContext] Removing', supabaseKeys.length, 'Supabase keys');
        await AsyncStorage.multiRemove(supabaseKeys);
      }
      
      await AsyncStorage.removeItem('@aceit_navigation_state_v1');
      
      // Clear onboarding flag to restart the onboarding flow on next launch
      console.log('[AuthContext] Step 4: Clearing onboarding flag');
      await AsyncStorage.removeItem('@onboarding_complete');
      setOnboardingComplete(false);
      
      console.log('[AuthContext] Sign out completed successfully');
      console.log('[AuthContext] ===== SIGN OUT COMPLETED =====');
      return { error: null };
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err.message);
      console.log('[AuthContext] ===== SIGN OUT COMPLETED (WITH ERROR) =====');
      // Still clear state even if there's an error
      setUser(null);
      setSession(null);
      setError(err.message);
      throw err;
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log('[AuthContext] Completing onboarding...');
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      setOnboardingComplete(true);
      console.log('[AuthContext] Onboarding completed');
    } catch (error) {
      console.error('[AuthContext] Error completing onboarding:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    onboardingComplete,
    isAuthenticated: !!user,
    signOut,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
