import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { signIn, signUp, signInWithGoogle, sendWelcomeEmail, requestPasswordReset } from '../services/authService';
import { parseAuthError, isValidEmail, isValidPassword } from '../services/errorHandler';
import { showError, showSuccess } from '../services/notificationService';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '../services/rateLimitService';
import { validateEmail, validatePassword, validateFullName, getPasswordRequirementStatus } from '../services/inputValidationService';

export default function LoginSignupScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [awaitingGoogleCallback, setAwaitingGoogleCallback] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0); // Cooldown timer in seconds
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle confirm password visibility
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const resetCooldownTimerRef = useRef(null); // Ref to track cooldown timer
  const submitScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Initialize password reset cooldown from localStorage on component mount
  useEffect(() => {
    const storedResetTime = localStorage.getItem('lastPasswordResetTime');
    if (storedResetTime) {
      const resetTime = parseInt(storedResetTime, 10);
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - resetTime) / 1000);
      const COOLDOWN_DURATION = 600; // 10 minutes in seconds
      
      if (elapsedSeconds < COOLDOWN_DURATION) {
        const remainingSeconds = COOLDOWN_DURATION - elapsedSeconds;
        console.log('[LoginSignup] Password reset cooldown restored from storage:', remainingSeconds, 's remaining');
        setResetCooldown(remainingSeconds);
      } else {
        // Cooldown has expired, clear it
        localStorage.removeItem('lastPasswordResetTime');
      }
    }
  }, []);

  // Create dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
      justifyContent: 'space-between',
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 32,
      marginTop: 20,
    },
    mainTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    toggleContainer: {
      flexDirection: 'row',
      marginBottom: 32,
      backgroundColor: theme.secondary,
      borderRadius: 12,
      padding: 4,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 10,
    },
    toggleActive: {
      backgroundColor: theme.primaryAccent,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    toggleTextActive: {
      color: theme.text,
    },
    form: {
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.secondary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputError: {
      borderColor: theme.error,
      borderWidth: 2,
    },
    errorText: {
      fontSize: 12,
      color: theme.error,
      marginTop: 6,
      marginLeft: 4,
      fontWeight: '500',
    },
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    passwordInput: {
      flex: 1,
      paddingRight: 50,
    },
    passwordToggleButton: {
      position: 'absolute',
      right: 12,
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    passwordToggleText: {
      fontSize: 18,
      color: theme.textSecondary,
    },
    requirementsContainer: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.secondary,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.primaryAccent,
    },
    requirementsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    requirementCheckmark: {
      fontSize: 14,
      fontWeight: '700',
      marginRight: 8,
      minWidth: 16,
    },
    requirementMet: {
      color: '#10b981',
    },
    requirementUnmet: {
      color: theme.error,
    },
    requirementText: {
      fontSize: 12,
      color: theme.textSecondary,
      flex: 1,
    },
    requirementMetText: {
      color: '#10b981',
      fontWeight: '600',
    },
    forgotPassword: {
      fontSize: 14,
      color: theme.primaryAccent,
      fontWeight: '600',
      textAlign: 'right',
      marginBottom: 20,
    },
    submitButton: {
      backgroundColor: theme.primaryAccent,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      color: theme.textTertiary,
      marginHorizontal: 16,
      fontSize: 14,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.secondary,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    socialIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    socialText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    footer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    footerText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    footerLink: {
      color: theme.primaryAccent,
      fontWeight: '700',
    },
    confirmationContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    confirmationContent: {
      alignItems: 'center',
      width: '100%',
    },
    checkmarkCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.secondary,
      borderWidth: 2,
      borderColor: theme.primaryAccent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    checkmarkIcon: {
      fontSize: 48,
    },
    confirmationTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    confirmationSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.primaryAccent,
      marginBottom: 16,
      textAlign: 'center',
    },
    confirmationMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
    },
    loaderContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    loaderText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 16,
      fontWeight: '500',
    },
    resendButton: {
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.primaryAccent,
    },
    resendText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primaryAccent,
    },
    // Success Screen Styles
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      paddingHorizontal: 20,
    },
    successContent: {
      alignItems: 'center',
    },
    successIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: theme.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    successIcon: {
      fontSize: 48,
    },
    successTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
    },
    successMessage: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    successSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    // Forgot Password Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 12,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalInputGroup: {
      marginBottom: 20,
    },
    modalInput: {
      backgroundColor: theme.secondary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalButtonPrimary: {
      backgroundColor: theme.primaryAccent,
    },
    modalButtonSecondary: {
      backgroundColor: theme.secondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalButtonTextPrimary: {
      color: theme.text,
    },
    modalButtonTextSecondary: {
      color: theme.text,
    },
    successMessage: {
      fontSize: 14,
      color: theme.success,
      textAlign: 'center',
      marginBottom: 16,
      fontWeight: '600',
    },
  });
  useEffect(() => {
    if (user && awaitingConfirmation) {
      console.log('[LoginSignup] User confirmed and logged in!');
      setAwaitingConfirmation(false);
      setConfirmationEmail('');
      // Navigate to Home after email confirmation
      setTimeout(() => {
        console.log('[LoginSignup] Navigating to Home after email confirmation');
        navigation.replace('Home');
      }, 1500);
    } else if (user && awaitingGoogleCallback) {
      console.log('[LoginSignup] Google OAuth callback detected, user logged in');
      setAwaitingGoogleCallback(false);
      
      // Send welcome email to the user
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0];
      console.log('[LoginSignup] Sending welcome email to:', user.email);
      sendWelcomeEmail(user.email, fullName);
      
      // Show success notification and navigate to Home
      showSuccess('Welcome!', `Account created successfully with ${user.email}`);
      setTimeout(() => {
        console.log('[LoginSignup] Navigating to Home after Google OAuth');
        navigation.replace('Home');
      }, 1500);
    }
  }, [user, awaitingConfirmation, awaitingGoogleCallback, navigation]);

  // Animate success screen when it appears
  useEffect(() => {
    if (showSuccessScreen) {
      console.log('[LoginSignup] Animating success screen');
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Navigate after 2 seconds
      setTimeout(() => {
        console.log('[LoginSignup] Success screen timeout, navigating to Home');
        navigation.replace('Home');
      }, 2000);
    }
  }, [showSuccessScreen]);

  // Real-time email validation (only on blur)
  const handleEmailChange = (value) => {
    setEmail(value);
  };

  const handleEmailBlur = () => {
    // Don't validate on blur - only validate on form submission
    // This prevents false rejections while typing
  };

  // Real-time password validation and requirements tracking
  const handlePasswordChange = (value) => {
    setPassword(value);
    // Update password requirements in real-time
    const requirements = getPasswordRequirementStatus(value);
    setPasswordRequirements(requirements);
  };

  const handlePasswordBlur = () => {
    let error = '';
    if (!isLogin && password.trim() && !isValidPassword(password)) {
      error = '❌ Password must be at least 6 characters';
    }
    setErrors(prev => ({ ...prev, password: error }));
  };

  // Real-time confirm password validation (only on blur)
  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
  };

  const handleConfirmPasswordBlur = () => {
    let error = '';
    if (!isLogin && confirmPassword && password && confirmPassword !== password) {
      error = '❌ Passwords do not match';
    }
    setErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  // Real-time name validation (only on blur)
  const handleNameChange = (value) => {
    setName(value);
  };

  const handleNameBlur = () => {
    let error = '';
    if (name.trim() && name.trim().length < 2) {
      error = '❌ Name must be at least 2 characters';
    } else if (!isLogin && name.trim() && !/^[a-zA-Z\s]*$/.test(name)) {
      error = '❌ Name can only contain letters and spaces';
    }
    setErrors(prev => ({ ...prev, name: error }));
  };

  const handleSubmit = async () => {
    // Check rate limiting first (for login attempts)
    const { allowed, error: rateLimitError } = await checkRateLimit(email.toLowerCase());
    if (!rateLimitError && !allowed) {
      showError('Too Many Attempts', rateLimitError);
      return;
    }

    // Validate email input
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      showError('Invalid Email', emailValidation.error);
      return;
    }

    // Validate password input
    if (!password.trim()) {
      showError('Required Field', 'Please enter your password');
      return;
    }

    if (!isLogin) {
      // Validate name input for signup
      const nameValidation = validateFullName(name);
      if (!nameValidation.valid) {
        showError('Invalid Name', nameValidation.error);
        return;
      }

      // Validate password strength for signup
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        showError('Weak Password', `Password requirements:\n• ${passwordValidation.errors.join('\n• ')}`);
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords Mismatch', 'Your passwords do not match. Please check and try again.');
        return;
      }
    }

    setLoading(true);
    Animated.sequence([
      Animated.timing(submitScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(submitScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      let result;
      const normalizedEmail = email.toLowerCase().trim();

      if (isLogin) {
        console.log('[LoginSignup] Attempting login...');
        result = await signIn(normalizedEmail, password);
      } else {
        console.log('[LoginSignup] Attempting signup...');
        result = await signUp(normalizedEmail, password, name);
      }

      if (result.error) {
        setLoading(false);
        
        // Record failed attempt for rate limiting (only on login)
        if (isLogin) {
          await recordFailedAttempt(normalizedEmail);
        }

        const { title, message } = parseAuthError(result.error);
        console.error(`[LoginSignup] ${isLogin ? 'Login' : 'Signup'} error:`, result.error);
        showError(title, message);
      } else {
        if (isLogin) {
          console.log('[LoginSignup] Login successful');
          // Clear failed attempts on successful login
          await clearAttempts(normalizedEmail);
          setLoading(false);
          // Clear form fields
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          // Show success screen before navigating
          setSuccessMessage('Welcome back!');
          setShowSuccessScreen(true);
        } else {
          // Signup successful - show confirmation waiting screen
          console.log('[LoginSignup] Signup successful, waiting for email confirmation');
          showSuccess('Signup Successful', 'Please check your email to verify your account');
          setAwaitingConfirmation(true);
          setConfirmationEmail(normalizedEmail);
          setLoading(false);
        }
      }
    } catch (error) {
      setLoading(false);
      const { title, message } = parseAuthError(error.message);
      console.error('[LoginSignup] Exception:', error);
      showError(title, message);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[LoginSignup] Google Sign-In button clicked');
    setLoading(true);
    setAwaitingGoogleCallback(true);
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        console.error('[LoginSignup] Google sign-in error:', error);
        setAwaitingGoogleCallback(false);
        setLoading(false);
        showError('Google Sign-In Failed', error || 'Unable to sign in with Google');
        return;
      }
      
      // Google OAuth will redirect the page, so no need to handle navigation here
      console.log('[LoginSignup] Google OAuth redirecting...');
      showSuccess('Signing in...', 'Redirecting to Google...');
      // Keep loading state and awaitingGoogleCallback state until user is logged in
    } catch (error) {
      setAwaitingGoogleCallback(false);
      setLoading(false);
      console.error('[LoginSignup] Google Sign-In exception:', error);
      showError('Error', error.message || 'Failed to initiate Google Sign-In');
    }
  };

  // Cooldown timer effect
  // Handle password reset cooldown countdown
  useEffect(() => {
    if (resetCooldown <= 0) {
      if (resetCooldownTimerRef.current) {
        clearInterval(resetCooldownTimerRef.current);
        resetCooldownTimerRef.current = null;
      }
      return;
    }

    // Clear existing timer if any
    if (resetCooldownTimerRef.current) {
      clearInterval(resetCooldownTimerRef.current);
    }

    // Start countdown
    resetCooldownTimerRef.current = setInterval(() => {
      setResetCooldown(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(resetCooldownTimerRef.current);
          resetCooldownTimerRef.current = null;
          localStorage.removeItem('lastPasswordResetTime');
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => {
      if (resetCooldownTimerRef.current) {
        clearInterval(resetCooldownTimerRef.current);
        resetCooldownTimerRef.current = null;
      }
    };
  }, [resetCooldown]);

  const handleForgotPasswordRequest = async () => {
    // Check cooldown
    if (resetCooldown > 0) {
      showError('Please Wait', `Try again in ${resetCooldown} seconds`);
      return;
    }

    // Validate email
    const emailValidation = validateEmail(resetEmail);
    if (!emailValidation.valid) {
      showError('Invalid Email', emailValidation.error);
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await requestPasswordReset(resetEmail.toLowerCase().trim());
      if (error) {
        console.error('[LoginSignup] Password reset error:', error);
        showError('Password Reset Failed', error);
        // Set cooldown on rate limit errors and store timestamp
        if (error.includes('rate limit')) {
          const COOLDOWN_DURATION = 600; // 10 minutes
          setResetCooldown(COOLDOWN_DURATION);
          localStorage.setItem('lastPasswordResetTime', Date.now().toString());
          console.log('[LoginSignup] Password reset cooldown stored in localStorage for 10 minutes');
        }
      } else {
        console.log('[LoginSignup] Password reset email sent successfully');
        showSuccess('Email Sent', 'Check your email for password reset instructions');
        setResetSent(true);
        setResetEmail('');
        setResetCooldown(60); // 1 minute cooldown between attempts
        localStorage.setItem('lastPasswordResetTime', Date.now().toString());
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowForgotPasswordModal(false);
          setResetSent(false);
        }, 2000);
      }
    } catch (error) {
      console.error('[LoginSignup] Password reset exception:', error);
      showError('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setResetEmail('');
    setResetSent(false);
  };

  // Show confirmation waiting screen
  if (awaitingConfirmation) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar onMenuPress={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationContent}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmarkIcon}>✉️</Text>
            </View>
            <Text style={styles.confirmationTitle}>Check Your Email</Text>
            <Text style={styles.confirmationSubtitle}>
              We've sent a confirmation link to {confirmationEmail}
            </Text>
            <Text style={styles.confirmationMessage}>
              Click the link in your email to verify your account. Once confirmed, you'll be automatically logged in.
            </Text>
            
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.primaryAccent} />
              <Text style={styles.loaderText}>Waiting for confirmation...</Text>
            </View>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setAwaitingConfirmation(false);
                setConfirmationEmail('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resendText}>Back to Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show Google OAuth callback waiting screen
  if (awaitingGoogleCallback) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar onMenuPress={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationContent}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmarkIcon}>🔐</Text>
            </View>
            <Text style={styles.confirmationTitle}>Completing Sign-In</Text>
            <Text style={styles.confirmationSubtitle}>
              Signing you in with Google
            </Text>
            <Text style={styles.confirmationMessage}>
              We're setting up your account and sending you a welcome email. This should take just a moment.
            </Text>
            
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.primaryAccent} />
              <Text style={styles.loaderText}>Please wait...</Text>
            </View>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setAwaitingGoogleCallback(false);
                setLoading(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resendText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show success screen after login
  if (showSuccessScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View 
            style={[
              styles.successContent,
              {
                transform: [{ scale: successScale }],
                opacity: successOpacity,
              }
            ]}
          >
            <View style={styles.successIconCircle}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
            <Text style={styles.successTitle}>Welcome!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <Text style={styles.successSubtext}>Redirecting to your dashboard...</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <Text style={styles.mainTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to continue learning' : 'Join AceIt and start studying'}
            </Text>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && styles.toggleActive]}
              onPress={() => {
                setIsLogin(true);
                setErrors({ email: '', password: '', name: '', confirmPassword: '' });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && styles.toggleActive]}
              onPress={() => {
                setIsLogin(false);
                setErrors({ email: '', password: '', name: '', confirmPassword: '' });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={handleNameChange}
                  onBlur={handleNameBlur}
                  editable={!loading}
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.passwordToggleButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={!password}
                >
                  <Text style={styles.passwordToggleText}>{showPassword ? '👁' : '⌣'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              
              {/* Password Requirements Display (Signup Only) */}
              {!isLogin && password && (
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <View style={styles.requirementItem}>
                    <Text style={[styles.requirementCheckmark, passwordRequirements.hasMinLength ? styles.requirementMet : styles.requirementUnmet]}>
                      {passwordRequirements.hasMinLength ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.requirementText, passwordRequirements.hasMinLength ? styles.requirementMetText : null]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={[styles.requirementCheckmark, passwordRequirements.hasUpperCase ? styles.requirementMet : styles.requirementUnmet]}>
                      {passwordRequirements.hasUpperCase ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.requirementText, passwordRequirements.hasUpperCase ? styles.requirementMetText : null]}>
                      At least one uppercase letter (A-Z)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={[styles.requirementCheckmark, passwordRequirements.hasLowerCase ? styles.requirementMet : styles.requirementUnmet]}>
                      {passwordRequirements.hasLowerCase ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.requirementText, passwordRequirements.hasLowerCase ? styles.requirementMetText : null]}>
                      At least one lowercase letter (a-z)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={[styles.requirementCheckmark, passwordRequirements.hasNumber ? styles.requirementMet : styles.requirementUnmet]}>
                      {passwordRequirements.hasNumber ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.requirementText, passwordRequirements.hasNumber ? styles.requirementMetText : null]}>
                      At least one number (0-9)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={[styles.requirementCheckmark, passwordRequirements.hasSpecialChar ? styles.requirementMet : styles.requirementUnmet]}>
                      {passwordRequirements.hasSpecialChar ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.requirementText, passwordRequirements.hasSpecialChar ? styles.requirementMetText : null]}>
                      At least one special character (!@#$%^&*...)
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.confirmPassword ? styles.inputError : null]}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.textTertiary}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggleButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={!confirmPassword}
                  >
                    <Text style={styles.passwordToggleText}>{showConfirmPassword ? '👁' : '⌣'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>
            )}

            {isLogin && (
              <TouchableOpacity onPress={() => setShowForgotPasswordModal(true)}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <Animated.View style={{ transform: [{ scale: submitScale }] }}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.submitText}>
                  {loading ? '...' : isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.socialButton} 
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={styles.socialText}>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text
                style={styles.footerLink}
                onPress={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeForgotPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!resetSent ? (
              <>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
                <View style={styles.modalInputGroup}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.textTertiary}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!resetLoading}
                  />
                </View>
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={closeForgotPasswordModal}
                    disabled={resetLoading}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalButtonPrimary,
                      (resetLoading || resetCooldown > 0) && { opacity: 0.6 }
                    ]}
                    onPress={handleForgotPasswordRequest}
                    disabled={resetLoading || resetCooldown > 0}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                      {resetLoading ? '...' : resetCooldown > 0 ? `Wait ${resetCooldown}s` : 'Send Link'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
                  <Text style={styles.modalTitle}>Check Your Email</Text>
                </View>
                <Text style={styles.successMessage}>
                  Password reset link sent to {resetEmail}
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, { marginTop: 16 }]}
                  onPress={closeForgotPasswordModal}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
