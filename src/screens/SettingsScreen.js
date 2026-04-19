import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          try {
            await signOut();
            // Navigation will happen automatically when auth state changes
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to logout');
            setLogoutLoading(false);
          }
        },
      },
    ]);
  };

  const SettingRow = ({ icon, title, description, value, onToggle, isToggle }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingContent}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDesc}>{description}</Text>}
        </View>
      </View>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#334155', true: '#6366f1' }}
          thumbColor="#fff"
        />
      ) : (
        <Text style={styles.settingArrow}></Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Profile', `Email: ${user?.email || 'N/A'}`)}
            activeOpacity={0.7}
          >
            <SettingRow
              icon=""
              title="Profile"
              description={user?.email || 'View your profile'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Change Password', 'Password change feature coming soon!')}
            activeOpacity={0.7}
          >
            <SettingRow
              icon=""
              title="Change Password"
              description="Update your password"
            />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingItem}>
            <SettingRow
              icon=""
              title="Dark Mode"
              description="Always enabled"
              value={darkMode}
              onToggle={setDarkMode}
              isToggle
            />
          </View>
          <View style={styles.settingItem}>
            <SettingRow
              icon=""
              title="Auto-save"
              description="Automatically save your sets"
              value={autoSave}
              onToggle={setAutoSave}
              isToggle
            />
          </View>
          
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('About', 'AceIt v1.0.0\nYour personal study companion')}
            activeOpacity={0.7}
          >
            <SettingRow
              icon=""
              title="About"
              description="App version and info"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Help & Support', 'Contact us: support@aceit.com')}
            activeOpacity={0.7}
          >
            <SettingRow
              icon=""
              title="Help & Support"
              description="Get help and report issues"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Privacy', 'Read our privacy policy')}
            activeOpacity={0.7}
          >
            <SettingRow
              icon=""
              title="Privacy Policy"
              description="View our privacy practices"
            />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}> Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() =>
              Alert.alert('Delete Account', 'Are you sure you want to delete your account?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => Alert.alert('Account deleted'),
                },
              ])
            }
            activeOpacity={0.8}
          >
            <Text style={styles.deleteText}> Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AceIt v1.0.0</Text>
          <Text style={styles.copyright}>© 2026 AceIt. All rights reserved.</Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#334155',
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
    fontSize: 24,
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  settingArrow: {
    fontSize: 20,
    color: '#64748b',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: '#4c2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fca5a5',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#475569',
  },
});
