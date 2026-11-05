import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import { signIn, signUp, signInWithGoogle, sendWelcomeEmail, requestPasswordReset } from '../services/authService';
import { parseAuthError, isValidPassword } from '../services/errorHandler';
import { showError, showSuccess } from '../services/notificationService';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '../services/rateLimitService';
import { validateEmail, validatePassword, validateFullName, getPasswordRequirementStatus } from '../services/inputValidationService';
import soundManager from '../services/soundService';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function LoginSignupScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
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
  const [resetCooldown, setResetCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const [passwordRequirements, setPasswordRequirements] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const resetCooldownTimerRef = useRef(null);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedResetTime = localStorage.getItem('lastPasswordResetTime');
      if (storedResetTime) {
        const resetTime = parseInt(storedResetTime, 10);
        const elapsed = Math.floor((Date.now() - resetTime) / 1000);
        if (elapsed < 600) {
          setResetCooldown(600 - elapsed);
        } else {
          localStorage.removeItem('lastPasswordResetTime');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (user && awaitingConfirmation) {
      setAwaitingConfirmation(false);
      setConfirmationEmail('');
      setTimeout(() => navigation.replace('Home'), 1200);
    } else if (user && awaitingGoogleCallback) {
      setAwaitingGoogleCallback(false);
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0];
      sendWelcomeEmail(user.email, fullName);
      showSuccess('Welcome!', `Logged in with ${user.email}`);
      setTimeout(() => navigation.replace('Home'), 1200);
    }
  }, [user, awaitingConfirmation, awaitingGoogleCallback, navigation]);

  useEffect(() => {
    if (showSuccessScreen) {
      setTimeout(() => {
        navigation.replace('Home');
      }, 1500);
    }
  }, [showSuccessScreen, navigation]);

  const handlePasswordChange = (value) => {
    setPassword(value);
    const requirements = getPasswordRequirementStatus(value);
    setPasswordRequirements(requirements);
  };

  const handleSubmit = async () => {
    soundManager.playButtonClick();

    const { allowed, error: rateLimitError } = await checkRateLimit(email.toLowerCase());
    if (!rateLimitError && !allowed) {
      showError('Too Many Attempts', rateLimitError);
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      showError('Invalid Email', emailValidation.error);
      return;
    }

    if (!password.trim()) {
      showError('Required Field', 'Please enter your password');
      return;
    }

    if (!isLogin) {
      const nameValidation = validateFullName(name);
      if (!nameValidation.valid) {
        showError('Invalid Name', nameValidation.error);
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        showError('Weak Password', `Password requirements:\n• ${passwordValidation.errors.join('\n• ')}`);
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords Mismatch', 'Your passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      let result;
      const normalizedEmail = email.toLowerCase().trim();

      if (isLogin) {
        result = await signIn(normalizedEmail, password);
      } else {
        result = await signUp(normalizedEmail, password, name);
      }

      if (result.error) {
        setLoading(false);
        if (isLogin) await recordFailedAttempt(normalizedEmail);
        const { title, message } = parseAuthError(result.error);
        showError(title, message);
      } else {
        if (isLogin) {
          await clearAttempts(normalizedEmail);
          setLoading(false);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          setSuccessMessage('Welcome back to AceIt!');
          setShowSuccessScreen(true);
        } else {
          showSuccess('Account Created', 'Check your email to verify your account.');
          setAwaitingConfirmation(true);
          setConfirmationEmail(normalizedEmail);
          setLoading(false);
        }
      }
    } catch (error) {
      setLoading(false);
      const { title, message } = parseAuthError(error.message);
      showError(title, message);
    }
  };

  const handleGoogleSignIn = async () => {
    soundManager.playButtonClick();
    setLoading(true);
    setAwaitingGoogleCallback(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setAwaitingGoogleCallback(false);
        setLoading(false);
        showError('Google Sign-In Failed', error || 'Unable to sign in with Google');
        return;
      }
      showSuccess('Connecting', 'Redirecting to Google Authentication...');
    } catch (error) {
      setAwaitingGoogleCallback(false);
      setLoading(false);
      showError('Error', error.message || 'Failed to initiate Google Sign-In');
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (resetCooldown > 0) {
      showError('Please Wait', `Try again in ${resetCooldown} seconds`);
      return;
    }

    const emailValidation = validateEmail(resetEmail);
    if (!emailValidation.valid) {
      showError('Invalid Email', emailValidation.error);
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await requestPasswordReset(resetEmail.toLowerCase().trim());
      if (error) {
        showError('Password Reset Failed', error);
        if (error.includes('rate limit')) {
          setResetCooldown(600);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('lastPasswordResetTime', Date.now().toString());
          }
        }
      } else {
        showSuccess('Email Sent', 'Check your inbox for password reset instructions.');
        setResetEmail('');
        setResetCooldown(60);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('lastPasswordResetTime', Date.now().toString());
        }
        setTimeout(() => setShowForgotPasswordModal(false), 1500);
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const getInputShadow = (fieldName) => {
    const isFoc = focusedInput === fieldName;
    const offset = isFoc ? 3 : 1;
    return Platform.OS === 'web'
      ? {
          boxShadow: `${offset}px ${offset}px 0px ${shadowColor}`,
          outlineStyle: 'none',
        }
      : {};
  };

  // Success Screen
  if (showSuccessScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              Platform.OS === 'web' && {
                boxShadow: `6px 6px 0px ${shadowColor}`,
              },
            ]}
          >
            <View
              style={[
                styles.successStripe,
                {
                  backgroundColor: theme.success || '#10B981',
                  borderBottomColor: borderColor,
                  borderBottomWidth: borderWidth,
                },
              ]}
            >
              <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
              <Text style={styles.successStripeText}>AUTHENTICATION SUCCESSFUL</Text>
            </View>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={[styles.successTitle, { color: theme.text }]}>{successMessage}</Text>
              <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
                Redirecting you to your study decks...
              </Text>
              <BrutalButton
                title="ENTER STUDY DASHBOARD →"
                variant="primary"
                onPress={() => navigation.replace('Home')}
                style={{ width: '100%', marginTop: 16 }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Awaiting Email Confirmation Screen
  if (awaitingConfirmation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Navbar showMenu={false} showSettings={false} />
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              Platform.OS === 'web' && {
                boxShadow: `6px 6px 0px ${shadowColor}`,
              },
            ]}
          >
            <View
              style={[
                styles.successStripe,
                {
                  backgroundColor: theme.brandSecondary || '#FF5722',
                  borderBottomColor: borderColor,
                  borderBottomWidth: borderWidth,
                },
              ]}
            >
              <MaterialIcons name="mark-email-unread" size={24} color="#FFFFFF" />
              <Text style={styles.successStripeText}>CONFIRMATION REQUIRED</Text>
            </View>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={[styles.successTitle, { color: theme.text }]}>VERIFY YOUR EMAIL</Text>
              <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
                We sent an account activation link to:
              </Text>
              <View
                style={[
                  styles.emailBadgeBox,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={[styles.emailBadgeText, { color: theme.primary }]}>
                  {confirmationEmail}
                </Text>
              </View>
              <Text style={[styles.confirmNotice, { color: theme.textTertiary }]}>
                Click the confirmation link in your inbox. Once verified, you will be logged in automatically.
              </Text>
              <BrutalButton
                title="BACK TO LOGIN"
                variant="outline"
                onPress={() => {
                  setAwaitingConfirmation(false);
                  setIsLogin(true);
                }}
                style={{ width: '100%', marginTop: 16 }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar showMenu={false} showSettings={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.authWrapper}>
          {/* Main Brutalist Auth Card */}
          <View
            style={[
              styles.authCard,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              Platform.OS === 'web' && {
                boxShadow: `6px 6px 0px ${shadowColor}`,
              },
            ]}
          >
            {/* Header Accent Bar */}
            <View
              style={[
                styles.cardHeaderBar,
                {
                  backgroundColor: isLogin ? theme.primary : (theme.brandSecondary || '#FF5722'),
                  borderBottomColor: borderColor,
                  borderBottomWidth: borderWidth,
                },
              ]}
            >
              <MaterialIcons name={isLogin ? 'lock' : 'person-add'} size={20} color="#FFFFFF" />
              <Text style={styles.cardHeaderBarText}>
                {isLogin ? 'ACCOUNT LOGIN' : 'CREATE ACCOUNT'}
              </Text>
            </View>

            <View style={styles.cardInner}>
              {/* Segmented Mode Switcher */}
              <View style={styles.segmentedRow}>
                <Pressable
                  onPress={() => {
                    soundManager.playButtonClick();
                    setIsLogin(true);
                  }}
                  style={({ pressed }) => [
                    styles.segmentButton,
                    {
                      backgroundColor: isLogin ? theme.primary : theme.background,
                      borderColor: borderColor,
                      borderWidth: borderWidth,
                      transform: [
                        { translateX: pressed ? 1 : 0 },
                        { translateY: pressed ? 1 : 0 },
                      ],
                    },
                    Platform.OS === 'web' && isLogin && {
                      boxShadow: `2px 2px 0px ${shadowColor}`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isLogin ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    SIGN IN
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    soundManager.playButtonClick();
                    setIsLogin(false);
                  }}
                  style={({ pressed }) => [
                    styles.segmentButton,
                    {
                      backgroundColor: !isLogin ? (theme.brandSecondary || '#FF5722') : theme.background,
                      borderColor: borderColor,
                      borderWidth: borderWidth,
                      transform: [
                        { translateX: pressed ? 1 : 0 },
                        { translateY: pressed ? 1 : 0 },
                      ],
                    },
                    Platform.OS === 'web' && !isLogin && {
                      boxShadow: `2px 2px 0px ${shadowColor}`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: !isLogin ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    REGISTER
                  </Text>
                </Pressable>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                {/* Full Name for Signup */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>FULL NAME</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Alex Morgan"
                      placeholderTextColor={theme.textTertiary || '#767676'}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      style={[
                        styles.inputField,
                        {
                          backgroundColor: theme.background,
                          borderColor: focusedInput === 'name' ? theme.primary : borderColor,
                          borderWidth: borderWidth,
                          color: theme.text,
                        },
                        getInputShadow('name'),
                      ]}
                    />
                  </View>
                )}

                {/* Email Address */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>STUDY EMAIL</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="student@university.edu"
                    placeholderTextColor={theme.textTertiary || '#767676'}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    style={[
                      styles.inputField,
                      {
                        backgroundColor: theme.background,
                        borderColor: focusedInput === 'email' ? theme.primary : borderColor,
                        borderWidth: borderWidth,
                        color: theme.text,
                      },
                      getInputShadow('email'),
                    ]}
                  />
                </View>

                {/* Password Field */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>PASSWORD</Text>
                    {isLogin && (
                      <TouchableOpacity
                        onPress={() => setShowForgotPasswordModal(true)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.forgotLink, { color: theme.primary }]}>
                          FORGOT PASSWORD?
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      value={password}
                      onChangeText={handlePasswordChange}
                      placeholder="••••••••••••"
                      placeholderTextColor={theme.textTertiary || '#767676'}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      style={[
                        styles.inputField,
                        {
                          backgroundColor: theme.background,
                          borderColor: focusedInput === 'password' ? theme.primary : borderColor,
                          borderWidth: borderWidth,
                          color: theme.text,
                          paddingRight: 50,
                        },
                        getInputShadow('password'),
                      ]}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      accessibilityLabel="Toggle password visibility"
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={22}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password Requirements Checklist (for Register) */}
                {!isLogin && (
                  <View
                    style={[
                      styles.requirementsBox,
                      {
                        backgroundColor: theme.background,
                        borderColor: borderColor,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <Text style={[styles.reqHeader, { color: theme.text }]}>
                      SECURITY CRITERIA:
                    </Text>
                    <View style={styles.reqGrid}>
                      <View style={styles.reqRow}>
                        <MaterialIcons
                          name={passwordRequirements.hasMinLength ? 'check-box' : 'check-box-outline-blank'}
                          size={18}
                          color={passwordRequirements.hasMinLength ? '#10B981' : theme.textTertiary}
                        />
                        <Text style={[styles.reqItemText, { color: theme.textSecondary }]}>
                          8+ characters
                        </Text>
                      </View>
                      <View style={styles.reqRow}>
                        <MaterialIcons
                          name={passwordRequirements.hasUpperCase ? 'check-box' : 'check-box-outline-blank'}
                          size={18}
                          color={passwordRequirements.hasUpperCase ? '#10B981' : theme.textTertiary}
                        />
                        <Text style={[styles.reqItemText, { color: theme.textSecondary }]}>
                          Uppercase letter
                        </Text>
                      </View>
                      <View style={styles.reqRow}>
                        <MaterialIcons
                          name={passwordRequirements.hasNumber ? 'check-box' : 'check-box-outline-blank'}
                          size={18}
                          color={passwordRequirements.hasNumber ? '#10B981' : theme.textTertiary}
                        />
                        <Text style={[styles.reqItemText, { color: theme.textSecondary }]}>
                          Number (0-9)
                        </Text>
                      </View>
                      <View style={styles.reqRow}>
                        <MaterialIcons
                          name={passwordRequirements.hasSpecialChar ? 'check-box' : 'check-box-outline-blank'}
                          size={18}
                          color={passwordRequirements.hasSpecialChar ? '#10B981' : theme.textTertiary}
                        />
                        <Text style={[styles.reqItemText, { color: theme.textSecondary }]}>
                          Special symbol
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Confirm Password (for Register) */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>CONFIRM PASSWORD</Text>
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="••••••••••••"
                        placeholderTextColor={theme.textTertiary || '#767676'}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput(null)}
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: theme.background,
                            borderColor: focusedInput === 'confirmPassword' ? theme.primary : borderColor,
                            borderWidth: borderWidth,
                            color: theme.text,
                            paddingRight: 50,
                          },
                          getInputShadow('confirmPassword'),
                        ]}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeButton}
                        accessibilityLabel="Toggle confirm password visibility"
                      >
                        <MaterialIcons
                          name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                          size={22}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Submit Action Button */}
                <BrutalButton
                  title={
                    loading
                      ? 'AUTHENTICATING...'
                      : isLogin
                      ? 'SIGN IN TO ACEIT'
                      : 'CREATE MY ACCOUNT →'
                  }
                  variant={isLogin ? 'primary' : 'secondary'}
                  disabled={loading}
                  icon={
                    loading ? (
                      <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                    ) : (
                      <MaterialIcons name={isLogin ? 'login' : 'how-to-reg'} size={20} color="#FFFFFF" />
                    )
                  }
                  onPress={handleSubmit}
                  style={{ marginTop: 8 }}
                />
              </View>

              {/* Or Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerBar, { backgroundColor: borderColor }]} />
                <Text style={[styles.dividerLabel, { color: theme.textSecondary }]}>OR SIGN IN WITH</Text>
                <View style={[styles.dividerBar, { backgroundColor: borderColor }]} />
              </View>

              {/* Google OAuth Button */}
              <BrutalButton
                title="CONTINUE WITH GOOGLE"
                variant="outline"
                disabled={loading}
                icon={<MaterialIcons name="account-circle" size={22} color={theme.text} />}
                onPress={handleGoogleSignIn}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalDialog,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              Platform.OS === 'web' && {
                boxShadow: `6px 6px 0px ${shadowColor}`,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeaderStripe,
                {
                  backgroundColor: theme.primary,
                  borderBottomColor: borderColor,
                  borderBottomWidth: borderWidth,
                },
              ]}
            >
              <Text style={styles.modalHeaderTitle}>RESET PASSWORD</Text>
              <Pressable
                onPress={() => setShowForgotPasswordModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={[styles.modalHelpText, { color: theme.textSecondary }]}>
                Enter the email associated with your account. We will send a secure reset link.
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>REGISTERED EMAIL</Text>
                <TextInput
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="student@university.edu"
                  placeholderTextColor={theme.textTertiary || '#767676'}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.background,
                      borderColor: borderColor,
                      borderWidth: borderWidth,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <BrutalButton
                  title="CANCEL"
                  variant="outline"
                  onPress={() => setShowForgotPasswordModal(false)}
                  style={{ flex: 1 }}
                />
                <BrutalButton
                  title={resetLoading ? 'SENDING...' : 'SEND LINK'}
                  variant="primary"
                  disabled={resetLoading}
                  onPress={handleForgotPasswordRequest}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authWrapper: {
    width: '100%',
    maxWidth: 460,
    marginVertical: 10,
  },
  authCard: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardHeaderBarText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  cardInner: {
    padding: 20,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  formContainer: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inputField: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  requirementsBox: {
    padding: 12,
    borderRadius: 4,
    marginVertical: 4,
  },
  reqHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  reqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  reqItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerBar: {
    flex: 1,
    height: 2,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalHeaderStripe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  modalHelpText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 16,
  },

  // Center / Feedback Screens
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  successCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 4,
    overflow: 'hidden',
  },
  successStripe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  successStripeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  emailBadgeBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    marginVertical: 14,
  },
  emailBadgeText: {
    fontSize: 14,
    fontWeight: '900',
  },
  confirmNotice: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
});
