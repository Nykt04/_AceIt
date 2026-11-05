import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuPress }) {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  const getPressableShadow = (pressed, offset = 3) => {
    const cur = pressed ? 1 : offset;
    return Platform.OS === 'web'
      ? {
          boxShadow: `${cur}px ${cur}px 0px ${shadowColor}`,
          cursor: 'pointer',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        }
      : {
          shadowColor: shadowColor,
          shadowOffset: { width: cur, height: cur },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: cur,
        };
  };

  return (
    <View
      style={[
        styles.navbar,
        {
          backgroundColor: theme.background,
          borderBottomColor: borderColor,
          borderBottomWidth: borderWidth,
        },
      ]}
    >
      {/* Menu Drawer Toggle */}
      <Pressable
        onPress={() => {
          console.log('[Navbar] Menu button pressed');
          onMenuPress?.();
        }}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: theme.card,
            borderColor: borderColor,
            borderWidth: borderWidth,
            transform: [
              { translateX: pressed ? 2 : 0 },
              { translateY: pressed ? 2 : 0 },
            ],
          },
          getPressableShadow(pressed),
        ]}
      >
        <MaterialIcons name="menu" size={24} color={theme.text} />
      </Pressable>

      {/* Brand Title / Logo */}
      <Pressable
        onPress={() => navigation.navigate('Home')}
        accessibilityRole="button"
        style={styles.logoContainer}
      >
        <View
          style={[
            styles.brandBadge,
            {
              backgroundColor: theme.primary,
              borderColor: borderColor,
              borderWidth: borderWidth,
            },
            Platform.OS === 'web' && {
              boxShadow: `3px 3px 0px ${shadowColor}`,
            },
          ]}
        >
          <Text style={styles.brandText}>ACEIT</Text>
        </View>
      </Pressable>

      {/* Right Controls: Theme Toggle & Settings */}
      <View style={styles.rightButtons}>
        <Pressable
          onPress={toggleTheme}
          accessibilityLabel="Toggle light and dark mode"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: isDarkMode ? '#2A2A2A' : '#FFDE59',
              borderColor: borderColor,
              borderWidth: borderWidth,
              transform: [
                { translateX: pressed ? 2 : 0 },
                { translateY: pressed ? 2 : 0 },
              ],
            },
            getPressableShadow(pressed),
          ]}
        >
          <MaterialIcons
            name={isDarkMode ? 'light-mode' : 'dark-mode'}
            size={22}
            color={isDarkMode ? '#FFFFFF' : '#121212'}
          />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Settings"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.settingsButton,
            {
              backgroundColor: theme.brandSecondary || '#FF5722',
              borderColor: borderColor,
              borderWidth: borderWidth,
              transform: [
                { translateX: pressed ? 2 : 0 },
                { translateY: pressed ? 2 : 0 },
              ],
            },
            getPressableShadow(pressed),
          ]}
        >
          <MaterialIcons name="settings" size={20} color="#FFFFFF" />
          <Text style={styles.settingsText}>SETTINGS</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
    userSelect: 'none',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 4,
    gap: 6,
  },
  settingsText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
