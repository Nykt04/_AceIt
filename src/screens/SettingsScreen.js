import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase, deleteAccount } from '../services/authService';
import { parseAuthError } from '../services/errorHandler';
import { showSuccess, showError } from '../services/notificationService';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.7);
  const [showPasswordReminder, setShowPasswordReminder] = useState(false);

  // Load sound settings from AsyncStorage
  useEffect(() => {
    loadSoundSettings();
  }, []);

  const loadSoundSettings = async () => {
    try {
      const savedSoundEnabled = await AsyncStorage.getItem('soundEnabled');
      const savedVolume = await AsyncStorage.getItem('soundVolume');
      
      if (savedSoundEnabled !== null) {
        setSoundEnabled(JSON.parse(savedSoundEnabled));
      }
      if (savedVolume !== null) {
        setSoundVolume(parseFloat(savedVolume));
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

  // Check if password change reminder should be shown
  useFocusEffect(
    React.useCallback(() => {
      checkPasswordChangeReminder();
    }, [])
  );

  const checkPasswordChangeReminder = async () => {
    try {
      const lastPasswordChangeTime = await AsyncStorage.getItem('lastPasswordChangeTime');
      const now = Date.now();
      const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

      if (!lastPasswordChangeTime) {
        // First time user hasn't changed password - show reminder
        setShowPasswordReminder(true);
      } else {
        const timeSinceLastChange = now - parseInt(lastPasswordChangeTime);
        if (timeSinceLastChange > NINETY_DAYS_MS) {
          // More than 90 days since last password change
          setShowPasswordReminder(true);
        } else {
          setShowPasswordReminder(false);
        }
      }
    } catch (error) {
      console.error('[Settings] Error checking password reminder:', error);
    }
  };

  const handlePasswordReminderDismiss = async () => {
    setShowPasswordReminder(false);
    try {
      // Record the time of the reminder dismissal (user acknowledged)
      await AsyncStorage.setItem('lastPasswordReminderTime', Date.now().toString());
    } catch (error) {
      console.error('[Settings] Error saving reminder time:', error);
    }
  };

  const handleLogout = async () => {
  const confirmed = typeof window !== 'undefined' && window.confirm 
    ? window.confirm('Are you sure you want to logout?')
    : true;
  
  if (!confirmed) return;
  
  console.log('[Settings] ===== LOGOUT BUTTON CLICKED =====');
  setLogoutLoading(true);
  try {
    console.log('[Settings] Starting logout...');
    await signOut();
    console.log('[Settings] Logout completed, redirecting to About screen');
    // Redirect to About screen after successful logout
    navigation.reset({
      index: 0,
      routes: [{ name: 'About' }],
    });
  } catch (error) {
    console.error('[Settings] Logout error:', error);
    console.log('[Settings] ===== LOGOUT COMPLETED (WITH ERROR) =====');
    setLogoutLoading(false);
    showError('Error', `Logout failed: ${error?.message || 'Unknown error'}`);
  }
};

  const handleDeleteAccount = async () => {
    console.log('[Settings] ===== DELETE BUTTON CLICKED =====');
    console.log('[Settings] Platform check - window exists:', typeof window !== 'undefined');
    
    let confirmed = false;
    
    // Use window.confirm for web, Alert.alert for native
    if (typeof window !== 'undefined') {
      console.log('[Settings] Using window.confirm for web');
      confirmed = window.confirm(
        'Are you sure you want to permanently delete your account? This cannot be undone.\n\nThis action cannot be reversed.'
      );
    } else {
      console.log('[Settings] Using Alert.alert for native');
      Alert.alert(
        'Delete Account',
        'Are you sure you want to permanently delete your account? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              confirmed = true;
              performDelete();
            },
          },
        ]
      );
      return;
    }
    
    console.log('[Settings] Confirmation result:', confirmed);
    
    if (confirmed) {
      performDelete();
    } else {
      console.log('[Settings] Delete cancelled by user');
    }
  };

  const performDelete = async () => {
    setDeleteLoading(true);
    try {
      console.log('[Settings] ===== DELETE ACCOUNT STARTED =====');
      console.log('[Settings] User ID:', user?.id);
      console.log('[Settings] User object:', user);
      
      // Delete user data first
      if (!user?.id) {
        throw new Error('User ID not found. User object: ' + JSON.stringify(user));
      }
      
      console.log('[Settings] Calling deleteAccount...');
      const { error: deleteError } = await deleteAccount(user.id);
      
      console.log('[Settings] Delete response - Error:', deleteError);
      
      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError}`);
      }
      
      console.log('[Settings] User data deleted successfully');
      
      // Then sign out
      console.log('[Settings] Signing out...');
      await signOut();
      
      console.log('[Settings] Account deleted and logged out');
      showSuccess('Account Deleted', 'Your account and all data have been permanently deleted.');
      // Auth state change will automatically trigger navigation to LoginSignup
    } catch (error) {
      console.error('[Settings] ===== DELETE ACCOUNT ERROR =====');
      console.error('[Settings] Error message:', error?.message);
      console.error('[Settings] Full error:', error);
      console.log('[Settings] ===== DELETE ACCOUNT COMPLETED (WITH ERROR) =====');
      setDeleteLoading(false);
      const { title, message } = parseAuthError(error?.message);
      showError(title, message);
    }
  };

  const SettingRow = ({ icon, title, description, value, onToggle, isToggle, theme }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingContent}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {description && <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>{description}</Text>}
        </View>
      </View>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.tertiary, true: theme.primaryAccent }}
          thumbColor={theme.primaryLight}
        />
      ) : (
        <Text style={[styles.settingArrow, { color: theme.textTertiary }]}>›</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Customize your experience</Text>
        </View>

        {/* Password Change Reminder Banner */}
        {showPasswordReminder && (
          <View style={[styles.reminderBanner, { backgroundColor: theme.isDark ? '#1e3a8a' : '#eff6ff', borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.reminderBannerIcon}>⚠️</Text>
            <View style={styles.reminderBannerContent}>
              <Text style={[styles.reminderBannerTitle, { color: theme.text }]}>Change Your Password</Text>
              <Text style={[styles.reminderBannerMessage, { color: theme.textSecondary }]}>
                It's been a while since you last changed your password. Update it to keep your account secure.
              </Text>
              <View style={styles.reminderBannerActions}>
                <TouchableOpacity
                  onPress={() => {
                    handlePasswordReminderDismiss();
                    navigation.navigate('ChangePassword');
                  }}
                  style={[styles.reminderBannerButton, { backgroundColor: '#3b82f6' }]}
                >
                  <Text style={styles.reminderBannerButtonText}>Change Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePasswordReminderDismiss}
                  style={[styles.reminderBannerButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3b82f6' }]}
                >
                  <Text style={[styles.reminderBannerButtonText, { color: '#3b82f6' }]}>Remind Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Account</Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => Alert.alert('Profile', `Email: ${user?.email || 'N/A'}`)}
            activeOpacity={0.7}
          >
            <SettingRow
              icon=""
              title="Profile"
              description={user?.email || 'View your profile'}
              theme={theme}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.7}
          >
            <SettingRow
              title="Change Password"
              description="Update your password"
              theme={theme}
            />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Preferences</Text>
          <View style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <SettingRow
              icon="🌓"
              title="Dark Mode"
              description={isDarkMode ? "Using dark theme" : "Using light theme"}
              value={isDarkMode}
              onToggle={toggleTheme}
              isToggle
              theme={theme}
            />
          </View>
          <View style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <SettingRow
              icon=""
              title="Auto-save"
              description="Automatically save your sets"
              value={autoSave}
              onToggle={setAutoSave}
              isToggle
              theme={theme}
            />
          </View>
          <View style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <SettingRow
              icon="🔊"
              title="Sound Effects"
              description="Enable audio feedback"
              value={soundEnabled}
              onToggle={handleSoundToggle}
              isToggle
              theme={theme}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>App</Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => navigation.navigate('About')}
            activeOpacity={0.7}
          >
            <SettingRow
              title="About"
              description="Learn more about AceIt"
              theme={theme}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => navigation.navigate('TermsAndConditionsView')}
            activeOpacity={0.7}
          >
            <SettingRow
              title="Terms & Conditions"
              description="Review our terms"
              theme={theme}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.7}
          >
            <SettingRow
              title="Privacy Policy"
              description="Review our privacy policy"
              theme={theme}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            onPress={() => navigation.navigate('HelpSupport')}
            activeOpacity={0.7}
          >
            <SettingRow
              title="Help & Support"
              description="Get help and contact us"
              theme={theme}
            />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: theme.tertiary }, logoutLoading && styles.buttonDisabled]}
            onPress={handleLogout}
            disabled={logoutLoading}
            activeOpacity={0.8}
          >
            {logoutLoading ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <Text style={[styles.logoutText, { color: theme.text }]}>Logout</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.isDark ? '#4c2626' : '#fee2e2', borderColor: theme.isDark ? '#7f1d1d' : '#fecaca' }, deleteLoading && styles.buttonDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
            activeOpacity={0.8}
          >
            {deleteLoading ? (
              <ActivityIndicator size="small" color={theme.isDark ? '#fca5a5' : '#dc2626'} />
            ) : (
              <Text style={[styles.deleteText, { color: theme.isDark ? '#fca5a5' : '#dc2626' }]}> Delete Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>AceIt v1.0.0</Text>
          <Text style={[styles.copyright, { color: theme.textTertiary }]}>© 2026 AceIt. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
    marginTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  settingItem: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 26,
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 20,
    color: '#64748b',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#334155',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: '#4c2626',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7f1d1d',
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fca5a5',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 36,
    paddingTop: 24,
    borderTopWidth: 1.5,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '600',
  },
  copyright: {
    fontSize: 12,
    color: '#64748b',
  },
  reminderBanner: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderBannerIcon: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  reminderBannerContent: {
    flex: 1,
  },
  reminderBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  reminderBannerMessage: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderBannerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderBannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
