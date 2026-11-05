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

const { width } = Dimensions.get('window');

export default function Sidebar({ isOpen, onClose }) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const sidebarWidth = Math.min(width * 0.85, 360);

  const slideAnim = React.useRef(new Animated.Value(-sidebarWidth - 20)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -sidebarWidth - 20,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, slideAnim, opacityAnim, sidebarWidth]);

  const handleNavigate = (screenName) => {
    navigation.navigate(screenName);
    onClose();
  };

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  const MenuItem = ({ iconName, label, onPress, accentColor }) => (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: accentColor || theme.card,
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
      <View style={styles.iconCircle}>
        <MaterialIcons
          name={iconName}
          size={22}
          color={theme.isDark ? '#FFFFFF' : '#121212'}
        />
      </View>
      <Text
        style={[
          styles.menuLabel,
          { color: theme.isDark ? '#FFFFFF' : '#121212' },
        ]}
      >
        {label}
      </Text>
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
            <Text style={styles.sidebarTitle}>ACEIT NAVIGATION</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
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
              ]}
            >
              <MaterialIcons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Core Navigation */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.textSecondary },
              ]}
            >
              STUDY & DECKS
            </Text>
            <MenuItem
              iconName="home"
              label="HOME"
              onPress={() => handleNavigate('Home')}
            />
            <MenuItem
              iconName="auto-awesome"
              label="AI GENERATE"
              onPress={() => handleNavigate('AIGenerate')}
            />
            <MenuItem
              iconName="upload-file"
              label="UPLOAD QUESTIONS"
              onPress={() => handleNavigate('FileUploadQuestions')}
            />
            <MenuItem
              iconName="add-box"
              label="CREATE SET"
              onPress={() => handleNavigate('CreateSet')}
            />
            <MenuItem
              iconName="info"
              label="ABOUT"
              onPress={() => handleNavigate('About')}
            />
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.textSecondary },
              ]}
            >
              ACCOUNT
            </Text>
            <MenuItem
              iconName="settings"
              label="SETTINGS"
              onPress={() => handleNavigate('Settings')}
            />
            <MenuItem
              iconName="login"
              label="LOGIN / SIGNUP"
              onPress={() => handleNavigate('LoginSignup')}
            />
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
              <Text style={[styles.infoTitle, { color: theme.text }]}>ACEIT v1.0.0</Text>
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
              backgroundColor: theme.background,
            },
          ]}
        >
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>
            © 2026 ACEIT • ZERO BLURS
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
  sidebarTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 10,
  },
  iconCircle: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  infoCard: {
    padding: 14,
    borderRadius: 4,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sidebarFooter: {
    padding: 14,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
