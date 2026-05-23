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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { changePassword, resetPasswordWithToken } from '../services/authService';
import { parseAuthError } from '../services/errorHandler';
import { showError, showSuccess } from '../services/notificationService';
import { validatePassword } from '../services/inputValidationService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isReset = route.params?.isReset || false;
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const submitScale = useRef(new Animated.Value(1)).current;
  const [resetToken, setResetToken] = useState(null);

  // Load reset token from storage if in reset mode
  useEffect(() => {
    if (isReset) {
      const loadResetToken = async () => {
        try {
          const token = await AsyncStorage.getItem('passwordResetToken');
          if (token) {
            setResetToken(token);
            console.log('[ChangePassword] Reset token loaded from storage');
          }
        } catch (error) {
          console.error('[ChangePassword] Error loading reset token:', error);
        }
      };
      loadResetToken();
    }
  }, [isReset]);

  // Password validation helper using the centralized validation service
  const validatePasswordInput = (password) => {
    const validation = validatePassword(password);
    const errors = {};
    if (!validation.valid && validation.errors) {
      validation.errors.forEach((error, index) => {
        errors[`error${index}`] = error;
      });
    }
    return errors;
  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    if (value.length > 0) {
      setShowPasswordRequirements(true);
      const errors = validatePasswordInput(value);
      setPasswordErrors(errors);
    } else {
      setShowPasswordRequirements(false);
      setPasswordErrors({});
    }
  };

  const handlePasswordUpdate = async () => {
    // Validation for reset mode (no current password required)
    if (isReset) {
      if (!newPassword.trim()) {
        showError('Required Field', 'Please enter a new password');
        return;
      }
      if (!confirmPassword.trim()) {
        showError('Required Field', 'Please confirm your new password');
        return;
      }
      if (newPassword !== confirmPassword) {
        showError('Passwords Mismatch', 'Passwords do not match. Please check and try again.');
        return;
      }

      // Use centralized password validation
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        showError('Weak Password', `Password requirements:\n• ${passwordValidation.errors.join('\n• ')}`);
        return;
      }

      return await handleResetPassword();
    }

    // Validation for normal change mode (requires current password)
    if (!currentPassword.trim()) {
      showError('Required Field', 'Please enter your current password');
      return;
    }
    if (!newPassword.trim()) {
      showError('Required Field', 'Please enter a new password');
      return;
    }
    if (!confirmPassword.trim()) {
      showError('Required Field', 'Please confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords Mismatch', 'New passwords do not match. Please check and try again.');
      return;
    }

    // Use centralized password validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      showError('Weak Password', `Password requirements:\n• ${passwordValidation.errors.join('\n• ')}`);
      return;
    }

    if (currentPassword === newPassword) {
      showError('Same Password', 'New password must be different from your current password');
      return;
    }

    return await handleChangePassword();
  };

  const handleChangePassword = async () => {
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
      console.log('[ChangePassword] Updating password...');
      const { error } = await changePassword(currentPassword, newPassword);

      if (error) {
        showError('Password Change Failed', error);
        setLoading(false);
        return;
      }

      console.log('[ChangePassword] Password changed successfully');
      showSuccess('Success', 'Your password has been changed successfully! 🎉');
      
      // Clear form after successful change
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
        setShowPasswordRequirements(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('[ChangePassword] Error:', error);
      const { title, message } = parseAuthError(error.message);
      showError(title, message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      showError('Invalid Reset', 'Password reset token not found. Please request a new password reset link.');
      return;
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
      console.log('[ChangePassword] Resetting password with token...');
      const { error } = await resetPasswordWithToken(newPassword, resetToken);

      if (error) {
        showError('Password Reset Failed', error);
        setLoading(false);
        return;
      }

      console.log('[ChangePassword] Password reset successfully');
      showSuccess('Success', 'Your password has been reset successfully! 🎉');
      
      // Clear storage and form
      await AsyncStorage.removeItem('passwordResetToken');
      await AsyncStorage.removeItem('isPasswordReset');
      
      setTimeout(() => {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
        setShowPasswordRequirements(false);
        // Navigate to login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginSignup' }],
        });
      }, 1500);
    } catch (error) {
      console.error('[ChangePassword] Reset error:', error);
      const { title, message } = parseAuthError(error.message);
      showError(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {!isReset && <Navbar onMenuPress={() => setSidebarOpen(true)} />}
      {!isReset && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Password Change/Reset Reminder Banner */}
          <View style={[styles.reminderBanner, isReset && styles.reminderBannerReset]}>
            <Text style={styles.reminderIcon}>{isReset ? '🔑' : '🔐'}</Text>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>
                {isReset ? 'Reset Your Password' : 'Keep Your Account Secure'}
              </Text>
              <Text style={styles.reminderMessage}>
                {isReset 
                  ? 'Create a new password to regain access to your account.' 
                  : 'We recommend changing your password every 3-6 months to maintain your account security.'}
              </Text>
            </View>
          </View>

          <View style={styles.header}>
            {!isReset && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backText}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>
              {isReset ? 'Reset Password' : 'Change Password'}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              {isReset 
                ? 'Enter a new password to regain access to your account'
                : 'Enter your current password and choose a new one'}
            </Text>

            <View style={styles.form}>
              {/* Only show current password field if NOT in reset mode */}
              {!isReset && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your current password"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    editable={!loading}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={handleNewPasswordChange}
                  editable={!loading}
                />
                
                {showPasswordRequirements && (
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <View style={styles.requirementItem}>
                      <Text style={newPassword.length >= 8 ? styles.requirementMet : styles.requirementUnmet}>
                        {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text style={/[A-Z]/.test(newPassword) ? styles.requirementMet : styles.requirementUnmet}>
                        {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter (A-Z)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text style={/[a-z]/.test(newPassword) ? styles.requirementMet : styles.requirementUnmet}>
                        {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter (a-z)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text style={/[0-9]/.test(newPassword) ? styles.requirementMet : styles.requirementUnmet}>
                        {/[0-9]/.test(newPassword) ? '✓' : '○'} One number (0-9)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Text style={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? styles.requirementMet : styles.requirementUnmet}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '✓' : '○'} One special character (!@#$%...)
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>

              <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handlePasswordUpdate}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitText}>
                    {loading ? 'Updating...' : (isReset ? 'Reset Password' : 'Change Password')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
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
  },
  reminderBanner: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderBannerReset: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#1e293b',
  },
  reminderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  backButton: {
    paddingRight: 15,
  },
  backText: {
    fontSize: 24,
    color: '#6366f1',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 30,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'System',
  },
  passwordRequirements: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  requirementItem: {
    marginBottom: 6,
  },
  requirementMet: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  requirementUnmet: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
