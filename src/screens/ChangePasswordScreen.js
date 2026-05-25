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
import { useTheme } from '../context/ThemeContext';
import { changePassword, resetPasswordWithToken } from '../services/authService';
import { parseAuthError } from '../services/errorHandler';
import { showError, showSuccess } from '../services/notificationService';
import { validatePassword } from '../services/inputValidationService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
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
    <SafeAreaView style={[styles(theme).container]}>
      {!isReset && <Navbar onMenuPress={() => setSidebarOpen(true)} />}
      {!isReset && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles(theme).scrollContent} keyboardShouldPersistTaps="handled">
          {/* Password Change/Reset Reminder Banner */}
          <View style={[styles(theme).reminderBanner, isReset && styles(theme).reminderBannerReset]}>
            <View style={styles(theme).reminderContent}>
              <Text style={styles(theme).reminderTitle}>
                {isReset ? 'Reset Your Password' : 'Keep Your Account Secure'}
              </Text>
              <Text style={styles(theme).reminderMessage}>
                {isReset 
                  ? 'Create a new password to regain access to your account.' 
                  : 'We recommend changing your password every 3-6 months to maintain your account security.'}
              </Text>
            </View>
          </View>

          <View style={styles(theme).header}>
            {!isReset && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles(theme).backButton}>
                <Text style={styles(theme).backText}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles(theme).title}>
              {isReset ? 'Reset Password' : 'Change Password'}
            </Text>
          </View>

          <View style={styles(theme).content}>
            <Text style={styles(theme).description}>
              {isReset 
                ? 'Enter a new password to regain access to your account'
                : 'Enter your current password and choose a new one'}
            </Text>

            <View style={styles(theme).form}>
              {/* Only show current password field if NOT in reset mode */}
              {!isReset && (
                <View style={styles(theme).inputGroup}>
                  <Text style={styles(theme).label}>Current Password</Text>
                  <TextInput
                    style={styles(theme).input}
                    placeholder="Enter your current password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    editable={!loading}
                  />
                </View>
              )}

              <View style={styles(theme).inputGroup}>
                <Text style={styles(theme).label}>New Password</Text>
                <TextInput
                  style={styles(theme).input}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={handleNewPasswordChange}
                  editable={!loading}
                />
                
                {showPasswordRequirements && (
                  <View style={styles(theme).passwordRequirements}>
                    <Text style={styles(theme).requirementsTitle}>Password Requirements:</Text>
                    <View style={styles(theme).requirementItem}>
                      <Text style={newPassword.length >= 8 ? styles(theme).requirementMet : styles(theme).requirementUnmet}>
                        {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                      </Text>
                    </View>
                    <View style={styles(theme).requirementItem}>
                      <Text style={/[A-Z]/.test(newPassword) ? styles(theme).requirementMet : styles(theme).requirementUnmet}>
                        {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter (A-Z)
                      </Text>
                    </View>
                    <View style={styles(theme).requirementItem}>
                      <Text style={/[a-z]/.test(newPassword) ? styles(theme).requirementMet : styles(theme).requirementUnmet}>
                        {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter (a-z)
                      </Text>
                    </View>
                    <View style={styles(theme).requirementItem}>
                      <Text style={/[0-9]/.test(newPassword) ? styles(theme).requirementMet : styles(theme).requirementUnmet}>
                        {/[0-9]/.test(newPassword) ? '✓' : '○'} One number (0-9)
                      </Text>
                    </View>
                    <View style={styles(theme).requirementItem}>
                      <Text style={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? styles(theme).requirementMet : styles(theme).requirementUnmet}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '✓' : '○'} One special character (!@#$%...)
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles(theme).inputGroup}>
                <Text style={styles(theme).label}>Confirm Password</Text>
                <TextInput
                  style={styles(theme).input}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>

              <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                <TouchableOpacity
                  style={[styles(theme).submitButton, loading && styles(theme).submitButtonDisabled]}
                  onPress={handlePasswordUpdate}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles(theme).submitText}>
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

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  reminderBanner: {
    backgroundColor: theme.secondary,
    borderLeftWidth: 4,
    borderLeftColor: theme.primaryAccent,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderBannerReset: {
    borderLeftColor: '#f59e0b',
    backgroundColor: theme.secondary,
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
    color: theme.text,
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 12,
    color: theme.textSecondary,
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
    color: theme.primaryAccent,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: theme.textSecondary,
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
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.secondary,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 16,
    fontFamily: 'System',
  },
  passwordRequirements: {
    backgroundColor: theme.secondary,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
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
    backgroundColor: theme.primaryAccent,
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
