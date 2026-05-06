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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { signIn, signUp, signInWithGoogle, sendWelcomeEmail } from '../services/authService';
import { parseAuthError, isValidEmail, isValidPassword } from '../services/errorHandler';
import { showError, showSuccess } from '../services/notificationService';

export default function LoginSignupScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
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
  const submitScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // If user logs in while waiting for confirmation, clear the confirmation state
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
    let error = '';
    if (email.trim() && !isValidEmail(email)) {
      error = '❌ Please enter a valid email (e.g., user@example.com)';
    }
    setErrors(prev => ({ ...prev, email: error }));
  };

  // Real-time password validation (only on blur)
  const handlePasswordChange = (value) => {
    setPassword(value);
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
    // Validation
    if (!email.trim()) {
      showError('Required Field', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Invalid Email', 'Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    if (!password.trim()) {
      showError('Required Field', 'Please enter your password');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        showError('Required Field', 'Please enter your name');
        return;
      }

      if (!isValidPassword(password)) {
        showError('Weak Password', 'Password must be at least 6 characters long');
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

      if (isLogin) {
        console.log('[LoginSignup] Attempting login...');
        result = await signIn(email, password);
      } else {
        console.log('[LoginSignup] Attempting signup...');
        result = await signUp(email, password, name);
      }

      if (result.error) {
        setLoading(false);
        const { title, message } = parseAuthError(result.error);
        console.error(`[LoginSignup] ${isLogin ? 'Login' : 'Signup'} error:`, result.error);
        showError(title, message);
      } else {
        if (isLogin) {
          console.log('[LoginSignup] Login successful');
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
          setConfirmationEmail(email);
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
              <ActivityIndicator size="large" color="#6366f1" />
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
              <ActivityIndicator size="large" color="#6366f1" />
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
      <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]}>
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
                  placeholderTextColor="#64748b"
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
                placeholderTextColor="#64748b"
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
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholder="Enter your password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={handlePasswordChange}
                onBlur={handlePasswordBlur}
                secureTextEntry
                editable={!loading}
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#64748b"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  secureTextEntry
                  editable={!loading}
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>
            )}

            {isLogin && (
              <TouchableOpacity onPress={() => Alert.alert('Info', 'Password reset feature coming soon!')}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: '#1e293b',
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
    backgroundColor: '#6366f1',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#fff',
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
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#6366f1',
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
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  footerLink: {
    color: '#6366f1',
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
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#6366f1',
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
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 14,
    color: '#94a3b8',
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
    color: '#94a3b8',
    marginTop: 16,
    fontWeight: '500',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
  },
  successContent: {
    alignItems: 'center',
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
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
    color: '#ffffff',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
