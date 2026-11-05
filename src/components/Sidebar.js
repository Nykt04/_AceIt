import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import soundManager from '../services/soundService';

const { width } = Dimensions.get('window');

export default function Sidebar({ isOpen, onClose }) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const sidebarWidth = Math.min(width * 0.85, 360);

  const slideAnim = React.useRef(new Animated.Value(-sidebarWidth - 20)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -sidebarWidth - 20,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [isOpen, slideAnim, opacityAnim, sidebarWidth]);

  const handleNavigate = (screenName) => {
    soundManager.playButtonClick();
    navigation.navigate(screenName);
    onClose();
  };

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const MenuItem = ({ iconName, label, onPress, badge, iconColor, accentBg }) => (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: theme.card,
          borderColor: borderColor,
          borderWidth: borderWidth,
          transform: [
            { translateX: pressed ? 2 : 0 },
            { translateY: pressed ? 2 : 0 },
          ],
        },
        Platform.OS === 'web' && {
          boxShadow: pressed
            ? `1px 1px 0px ${shadowColor}`
            : `3px 3px 0px ${shadowColor}`,
          cursor: 'pointer',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: accentBg || (theme.isDark ? '#232936' : '#F1F5F9'),
            borderColor: borderColor,
            borderWidth: 1.5,
          },
        ]}
      >
        <MaterialIcons
          name={iconName}
          size={20}
          color={iconColor || theme.primary}
        />
      </View>
      <Text style={[styles.menuLabel, { color: theme.text }]}>
        {label}
      </Text>
      {badge && (
        <View
          style={[
            styles.itemBadge,
            {
              backgroundColor: theme.accent || '#FCD34D',
              borderColor: borderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={theme.textTertiary || '#9CA3AF'}
        style={{ marginLeft: 'auto' }}
      />
    </Pressable>
  );

  return (
    <>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: opacityAnim,
            pointerEvents: isOpen ? 'auto' : 'none',
          },
        ]}
        onStartShouldSetResponder={() => true}
        onResponderRelease={onClose}
      />
      <Animated.View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme.background,
            borderRightColor: borderColor,
            borderRightWidth: borderWidth,
            pointerEvents: isOpen ? 'auto' : 'none',
          },
          Platform.OS === 'web' && {
            boxShadow: `6px 0px 0px ${shadowColor}`,
          },
        ]}
      >
        <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View
            style={[
              styles.sidebarHeader,
              {
                backgroundColor: theme.primary,
                borderBottomColor: borderColor,
                borderBottomWidth: borderWidth,
              },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.headerDot,
                  { backgroundColor: '#10B981', borderColor: '#FFFFFF', borderWidth: 1 },
                ]}
              />
              <Text style={styles.sidebarTitle}>ACEIT NAVIGATION</Text>
            </View>
            <Pressable
              onPress={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: theme.card,
                  borderColor: borderColor,
                  borderWidth: 2,
                  transform: [
                    { translateX: pressed ? 1 : 0 },
                    { translateY: pressed ? 1 : 0 },
                  ],
                },
                Platform.OS === 'web' && {
                  boxShadow: pressed
                    ? `1px 1px 0px ${shadowColor}`
                    : `2px 2px 0px ${shadowColor}`,
                },
              ]}
            >
              <MaterialIcons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* User Status Strip */}
          {isAuthenticated && user && (
            <View
              style={[
                styles.userStrip,
                {
                  backgroundColor: theme.card,
                  borderBottomColor: borderColor,
                  borderBottomWidth: borderWidth,
                },
              ]}
            >
              <MaterialIcons name="account-circle" size={20} color={theme.primary} />
              <Text style={[styles.userStripText, { color: theme.text }]} numberOfLines={1}>
                {user.email || 'AUTHENTICATED USER'}
              </Text>
            </View>
          )}

          {/* Core Navigation */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              STUDY & DECKS
            </Text>
            <MenuItem
              iconName="home"
              label="HOME DASHBOARD"
              iconColor={theme.primary}
              onPress={() => handleNavigate('Home')}
            />
            <MenuItem
              iconName="auto-awesome"
              label="AI GENERATE"
              badge="AI"
              iconColor="#EAB308"
              onPress={() => handleNavigate('AIGenerate')}
            />
            <MenuItem
              iconName="upload-file"
              label="UPLOAD QUESTIONS"
              iconColor="#10B981"
              onPress={() => handleNavigate('FileUploadQuestions')}
            />
            <MenuItem
              iconName="add-box"
              label="CREATE SET"
              iconColor="#F97316"
              onPress={() => handleNavigate('CreateSet')}
            />
            <MenuItem
              iconName="info"
              label="ABOUT"
              iconColor={theme.textSecondary}
              onPress={() => handleNavigate('About')}
            />
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              ACCOUNT & PREFERENCES
            </Text>
            <MenuItem
              iconName="settings"
              label="SETTINGS"
              iconColor="#6366F1"
              onPress={() => handleNavigate('Settings')}
            />
            {isAuthenticated ? (
              <MenuItem
                iconName="logout"
                label="LOG OUT"
                iconColor="#EF4444"
                onPress={async () => {
                  soundManager.playButtonClick();
                  onClose();
                  await signOut();
                }}
              />
            ) : (
              <MenuItem
                iconName="login"
                label="LOGIN / SIGNUP"
                iconColor={theme.primary}
                onPress={() => handleNavigate('LoginSignup')}
              />
            )}
          </View>

          {/* Info Card */}
          <View style={styles.section}>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.card,
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                },
                Platform.OS === 'web' && {
                  boxShadow: `3px 3px 0px ${shadowColor}`,
                },
              ]}
            >
              <View style={styles.infoBadgeRow}>
                <Text style={[styles.infoTitle, { color: theme.text }]}>ACEIT v2.0</Text>
                <View
                  style={[
                    styles.buildPill,
                    { backgroundColor: theme.accent || '#FCD34D', borderColor },
                  ]}
                >
                  <Text style={styles.buildPillText}>STABLE</Text>
                </View>
              </View>
              <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
                Strict Neubrutalism Study Engine
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.sidebarFooter,
            {
              borderTopColor: borderColor,
              borderTopWidth: borderWidth,
              backgroundColor: theme.card,
            },
          ]}
        >
          <Text style={[styles.footerText, { color: theme.textTertiary || '#9CA3AF' }]}>
            © 2026 ACEIT • TACTILE STUDY SYSTEM
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 99,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userStripText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#111827',
  },
  infoCard: {
    padding: 14,
    borderRadius: 4,
    marginBottom: 16,
  },
  infoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  buildPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
  },
  buildPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#111827',
  },
  infoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 14,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
});
