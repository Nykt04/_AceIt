import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { changePassword, resetPasswordWithToken } from '../services/authService';
import { parseAuthError } from '../services/errorHandler';
import { showError, showSuccess } from '../services/notificationService';
import { validatePassword } from '../services/inputValidationService';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

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
  const [passwordErrors, setPasswordErrors] = useState({});
  const [resetToken, setResetToken] = useState(null);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  useEffect(() => {
    if (isReset) {
      const loadResetToken = async () => {
        try {
          const token = await AsyncStorage.getItem('passwordResetToken');
          if (token) setResetToken(token);
        } catch (error) {
          console.error('[ChangePassword] Error loading reset token:', error);
        }
      };
      loadResetToken();
    }
  }, [isReset]);

  const validatePasswordInput = (pwd) => {
    const validation = validatePassword(pwd);
    const errors = {};
    if (!validation.valid && validation.errors) {
      validation.errors.forEach((err, idx) => {
        errors[`error${idx}`] = err;
      });
    }
    return errors;
  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    if (value.length > 0) {
      setPasswordErrors(validatePasswordInput(value));
    } else {
      setPasswordErrors({});
    }
  };

  const handlePasswordUpdate = async () => {
    soundManager.playButtonClick();

    if (isReset) {
      if (!newPassword.trim() || !confirmPassword.trim()) {
        showError('Please fill in both password fields');
        return;
      }
      if (newPassword !== confirmPassword) {
        showError('Passwords do not match');
        return;
      }
      const val = validatePassword(newPassword);
      if (!val.valid) {
        showError(`Password requirements:\n• ${val.errors.join('\n• ')}`);
        return;
      }
      return await handleResetPassword();
    }

    if (!currentPassword.trim()) {
      showError('Please enter your current password');
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showError('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    const val = validatePassword(newPassword);
    if (!val.valid) {
      showError(`Password requirements:\n• ${val.errors.join('\n• ')}`);
      return;
    }
    if (currentPassword === newPassword) {
      showError('New password must be different from current password');
      return;
    }

    return await handleChangePassword();
  };

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      const { error } = await changePassword(currentPassword, newPassword);
      if (error) {
        showError(error);
        setLoading(false);
        return;
      }

      soundManager.playSuccess();
      showSuccess('Your password has been changed successfully');
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (error) {
      const { title, message } = parseAuthError(error.message);
      showError(title, message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      showError('Reset token not found. Please request a new link.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPasswordWithToken(newPassword, resetToken);
      if (error) {
        showError(error);
        setLoading(false);
        return;
      }

      soundManager.playSuccess();
      showSuccess('Password reset successfully');
      await AsyncStorage.removeItem('passwordResetToken');
      await AsyncStorage.removeItem('isPasswordReset');

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginSignup' }],
        });
      }, 1200);
    } catch (error) {
      const { title, message } = parseAuthError(error.message);
      showError(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {!isReset && <Navbar onMenuPress={() => setSidebarOpen(true)} />}
      {!isReset && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* Hero Banner */}
            <View
              style={[
                styles.heroBanner,
                {
                  backgroundColor: theme.card,
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                },
                Platform.OS === 'web' && {
                  boxShadow: `4px 4px 0px ${shadowColor}`,
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.heroBadge,
                    {
                      backgroundColor: theme.accent || '#FCD34D',
                      borderColor: borderColor,
                      borderWidth: borderWidth,
                    },
                  ]}
                >
                  <Text style={styles.heroBadgeText}>SECURITY // CREDENTIALS</Text>
                </View>
                <BrutalBadge
                  label={isReset ? 'TOKEN AUTHENTICATED' : 'LOGGED IN'}
                  color={theme.primary}
                  textColor="#FFFFFF"
                />
              </View>

              <Text style={[styles.heroTitle, { color: theme.text }]}>
                {isReset ? 'RESET YOUR PASSWORD' : 'UPDATE SECURITY PASSWORD'}
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Ensure your account is protected with an 8+ character password containing mixed characters.
              </Text>
            </View>

            {/* Form Card */}
            <BrutalCard
              headerTitle="AUTHENTICATION FORM"
              accentColor={theme.primary}
              style={{ marginBottom: 20 }}
            >
              {!isReset && (
                <>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    CURRENT PASSWORD:
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                        color: theme.text,
                        marginBottom: 14,
                      },
                    ]}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                  />
                </>
              )}

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                NEW PASSWORD:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    color: theme.text,
                    marginBottom: 8,
                  },
                ]}
                placeholder="Enter new strong password"
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                secureTextEntry
              />

              {/* Password Errors / Requirements */}
              {Object.keys(passwordErrors).length > 0 && (
                <View
                  style={[
                    styles.reqBox,
                    {
                      backgroundColor: theme.isDark ? '#3E1C1C' : '#FEE2E2',
                      borderColor: '#EF4444',
                      borderWidth: 1,
                    },
                  ]}
                >
                  {Object.values(passwordErrors).map((err, i) => (
                    <Text key={i} style={styles.reqErrorText}>
                      • {err}
                    </Text>
                  ))}
                </View>
              )}

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                CONFIRM NEW PASSWORD:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    color: theme.text,
                    marginBottom: 20,
                  },
                ]}
                placeholder="Re-enter new password"
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <BrutalButton
                title={loading ? 'UPDATING CREDENTIALS...' : 'SAVE NEW PASSWORD'}
                variant="primary"
                icon={<MaterialIcons name="lock" size={20} color="#FFFFFF" />}
                onPress={handlePasswordUpdate}
                disabled={loading}
              />
            </BrutalCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 750,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  reqBox: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  reqErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 2,
  },
});
