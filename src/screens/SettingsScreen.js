import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteAccount } from '../services/authService';
import { parseAuthError } from '../services/errorHandler';
import { showSuccess, showError } from '../services/notificationService';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { signOut, user, isAuthenticated } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPasswordReminder, setShowPasswordReminder] = useState(false);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  useEffect(() => {
    loadSoundSettings();
  }, []);

  const loadSoundSettings = async () => {
    try {
      const savedSoundEnabled = await AsyncStorage.getItem('soundEnabled');
      if (savedSoundEnabled !== null) {
        setSoundEnabled(JSON.parse(savedSoundEnabled));
      }
    } catch (error) {
      console.error('[Settings] Error loading sound settings:', error);
    }
  };

  const handleSoundToggle = async (value) => {
    setSoundEnabled(value);
    soundManager.setSoundEnabled(value);
    try {
      await AsyncStorage.setItem('soundEnabled', JSON.stringify(value));
      if (value) {
        await soundManager.playSuccess();
      }
    } catch (error) {
      console.error('[Settings] Error saving sound setting:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkPasswordChangeReminder();
    }, [])
  );

  const checkPasswordChangeReminder = async () => {
    try {
      const lastPasswordChangeTime = await AsyncStorage.getItem('lastPasswordChangeTime');
      const now = Date.now();
      const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

      if (!lastPasswordChangeTime) {
        setShowPasswordReminder(true);
      } else {
        const timeSinceLastChange = now - parseInt(lastPasswordChangeTime, 10);
        setShowPasswordReminder(timeSinceLastChange > NINETY_DAYS_MS);
      }
    } catch (error) {
      console.error('[Settings] Error checking password reminder:', error);
    }
  };

  const handlePasswordReminderDismiss = async () => {
    setShowPasswordReminder(false);
    try {
      await AsyncStorage.setItem('lastPasswordReminderTime', Date.now().toString());
    } catch (error) {
      console.error('[Settings] Error saving reminder time:', error);
    }
  };

  const handleLogout = async () => {
    soundManager.playButtonClick();
    const confirmed =
      typeof window !== 'undefined' && window.confirm
        ? window.confirm('Are you sure you want to log out of AceIt?')
        : true;

    if (!confirmed) return;

    setLogoutLoading(true);
    try {
      await signOut();
      showSuccess('You have been logged out.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginSignup' }],
      });
    } catch (error) {
      setLogoutLoading(false);
      showError(`Logout failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteAccount = async () => {
    soundManager.playButtonClick();
    let confirmed = false;

    if (typeof window !== 'undefined') {
      confirmed = window.confirm(
        'PERMANENT ACCOUNT DELETION\n\nAre you absolutely sure? All your decks, questions, and progress will be permanently erased. This cannot be undone.'
      );
    } else {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to permanently delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Forever',
            style: 'destructive',
            onPress: () => performDelete(),
          },
        ]
      );
      return;
    }

    if (confirmed) {
      performDelete();
    }
  };

  const performDelete = async () => {
    setDeleteLoading(true);
    try {
      if (!user?.id) throw new Error('User session not found');

      const { error: deleteError } = await deleteAccount(user.id);
      if (deleteError) throw new Error(deleteError);

      await signOut();
      showSuccess('Account Deleted', 'Your account has been permanently removed.');
    } catch (error) {
      setDeleteLoading(false);
      const { title, message } = parseAuthError(error?.message);
      showError(title, message);
    }
  };

  const SettingLinkRow = ({ icon, label, description, onPress }) => (
    <Pressable
      onPress={() => {
        soundManager.playButtonClick();
        onPress();
      }}
      style={({ pressed }) => [
        styles.linkRow,
        {
          backgroundColor: theme.background,
          borderColor: borderColor,
          borderWidth: 1.5,
          transform: [
            { translateX: pressed ? 1 : 0 },
            { translateY: pressed ? 1 : 0 },
          ],
        },
        Platform.OS === 'web' && {
          boxShadow: pressed
            ? `1px 1px 0px ${shadowColor}`
            : `2px 2px 0px ${shadowColor}`,
          cursor: 'pointer',
        },
      ]}
    >
      <View style={styles.linkLeft}>
        <View
          style={[
            styles.linkIconBox,
            {
              backgroundColor: theme.isDark ? '#232936' : '#F1F5F9',
              borderColor: borderColor,
              borderWidth: 1,
            },
          ]}
        >
          <MaterialIcons name={icon} size={20} color={theme.primary} />
        </View>
        <View style={styles.linkTextCol}>
          <Text style={[styles.linkTitle, { color: theme.text }]}>{label}</Text>
          {description && (
            <Text style={[styles.linkDesc, { color: theme.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={theme.textTertiary || '#9CA3AF'}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                <Text style={styles.heroBadgeText}>PREFERENCES & SECURITY</Text>
              </View>
              <BrutalBadge
                label={isAuthenticated ? 'AUTHENTICATED' : 'GUEST SESSION'}
                color={isAuthenticated ? '#10B981' : theme.textSecondary}
                textColor="#FFFFFF"
              />
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>SYSTEM SETTINGS</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Control interface appearance, sound effects, security credentials, and account details.
            </Text>
          </View>

          {/* Password Reminder Banner */}
          {showPasswordReminder && isAuthenticated && (
            <View
              style={[
                styles.reminderCard,
                {
                  backgroundColor: theme.isDark ? '#1E293B' : '#FEF3C7',
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                },
                Platform.OS === 'web' && {
                  boxShadow: `3px 3px 0px ${shadowColor}`,
                },
              ]}
            >
              <View style={styles.reminderHeader}>
                <MaterialIcons name="security" size={22} color="#F59E0B" />
                <Text style={[styles.reminderTitle, { color: theme.text }]}>
                  SECURITY REMINDER: CHANGE PASSWORD
                </Text>
              </View>
              <Text style={[styles.reminderText, { color: theme.textSecondary }]}>
                It is recommended to update your security credentials periodically to keep your account safe.
              </Text>
              <View style={styles.reminderActionsRow}>
                <BrutalButton
                  title="UPDATE PASSWORD NOW"
                  variant="primary"
                  onPress={() => {
                    handlePasswordReminderDismiss();
                    navigation.navigate('ChangePassword');
                  }}
                  style={{ flex: 1 }}
                />
                <BrutalButton
                  title="REMIND LATER"
                  variant="secondary"
                  onPress={handlePasswordReminderDismiss}
                  style={{ flex: 0.8 }}
                />
              </View>
            </View>
          )}

          {/* 1. Interface & Audio Card */}
          <BrutalCard
            headerTitle="1. APPEARANCE & AUDIO"
            accentColor={theme.primary}
            style={{ marginBottom: 16 }}
          >
            {/* Dark Theme Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <View style={styles.labelWithIcon}>
                  <MaterialIcons
                    name={isDarkMode ? 'dark-mode' : 'light-mode'}
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={[styles.toggleTitle, { color: theme.text }]}>
                    Dark Theme
                  </Text>
                </View>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  {isDarkMode ? 'Active: High-contrast Dark Neubrutalism' : 'Active: Crisp Paper Light Neubrutalism'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={() => {
                  soundManager.playButtonClick();
                  toggleTheme();
                }}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#CBD5E1',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.divider,
                { borderBottomColor: theme.isDark ? '#374151' : '#E2E8F0', borderBottomWidth: 1 },
              ]}
            />

            {/* Sound Effects Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <View style={styles.labelWithIcon}>
                  <MaterialIcons
                    name={soundEnabled ? 'volume-up' : 'volume-off'}
                    size={20}
                    color={theme.accent || '#FCD34D'}
                  />
                  <Text style={[styles.toggleTitle, { color: theme.text }]}>
                    Tactile Audio Feedback
                  </Text>
                </View>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Click, snap, and success sounds during card flipping and quiz answering
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => {
                  soundManager.playButtonClick();
                  handleSoundToggle(val);
                }}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#CBD5E1',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </BrutalCard>

          {/* 2. Account & Authentication Card */}
          <BrutalCard
            headerTitle="2. ACCOUNT CREDENTIALS"
            accentColor={theme.accent || '#FCD34D'}
            style={{ marginBottom: 16 }}
          >
            <View style={styles.accountInfoRow}>
              <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>
                SIGN-IN STATUS:
              </Text>
              <Text style={[styles.accountEmail, { color: theme.text }]}>
                {user?.email || 'Guest User (Unauthenticated)'}
              </Text>
            </View>

            <View style={styles.accountActionsRow}>
              <View style={{ flex: 1 }}>
                <BrutalButton
                  title="CHANGE PASSWORD"
                  variant="secondary"
                  icon={<MaterialIcons name="lock-reset" size={18} color="#FFFFFF" />}
                  onPress={() => navigation.navigate('ChangePassword')}
                />
              </View>
              {isAuthenticated ? (
                <View style={{ flex: 1 }}>
                  <BrutalButton
                    title={logoutLoading ? 'LOGGING OUT...' : 'LOG OUT'}
                    variant="warning"
                    icon={<MaterialIcons name="logout" size={18} color="#FFFFFF" />}
                    onPress={handleLogout}
                    disabled={logoutLoading}
                  />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <BrutalButton
                    title="LOGIN / SIGNUP"
                    variant="primary"
                    icon={<MaterialIcons name="login" size={18} color="#FFFFFF" />}
                    onPress={() => navigation.navigate('LoginSignup')}
                  />
                </View>
              )}
            </View>
          </BrutalCard>

          {/* 3. Support & Policies Card */}
          <BrutalCard
            headerTitle="3. SUPPORT & LEGAL"
            accentColor={theme.brandSecondary || '#F97316'}
            style={{ marginBottom: 16 }}
          >
            <SettingLinkRow
              icon="help-outline"
              label="Help & Support Desk"
              description="Report an issue or get answers about AceIt"
              onPress={() => navigation.navigate('HelpSupport')}
            />
            <SettingLinkRow
              icon="description"
              label="Terms & Conditions"
              description="Review platform terms of service"
              onPress={() => navigation.navigate('TermsAndConditionsView')}
            />
            <SettingLinkRow
              icon="privacy-tip"
              label="Privacy Policy"
              description="How your data is protected and stored"
              onPress={() => navigation.navigate('PrivacyPolicyView')}
            />
            <SettingLinkRow
              icon="info-outline"
              label="About AceIt Architecture"
              description="Design philosophy, version 2.0 features"
              onPress={() => navigation.navigate('About')}
            />
          </BrutalCard>

          {/* 4. Danger Zone Card */}
          {isAuthenticated && (
            <BrutalCard
              headerTitle="4. DANGER ZONE"
              accentColor="#EF4444"
              style={{ marginBottom: 20 }}
            >
              <Text style={[styles.dangerNotice, { color: theme.textSecondary }]}>
                Permanently delete your account, saved flashcard decks, and study logs. This action cannot be reversed.
              </Text>
              <BrutalButton
                title={deleteLoading ? 'DELETING ACCOUNT...' : 'PERMANENTLY DELETE ACCOUNT'}
                variant="danger"
                icon={<MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />}
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
              />
            </BrutalCard>
          )}

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              ACEIT v2.0 • TACTILE NEUBRUTALISM STUDY ENGINE
            </Text>
            <Text style={[styles.copyright, { color: theme.textTertiary || '#9CA3AF' }]}>
              © 2026 AceIt. Zero Blurs. High Contrast.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    maxWidth: 900,
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
  reminderCard: {
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 12,
  },
  reminderActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  toggleDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 10,
  },
  accountInfoRow: {
    marginBottom: 14,
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '700',
  },
  accountActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  linkIconBox: {
    width: 34,
    height: 34,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTextCol: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  linkDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  dangerNotice: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  copyright: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
