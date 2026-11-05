import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuPress, showMenu = true, showSettings = true }) {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  const getPressableMotion = (pressed, hovered, offset = 3) => {
    const isDown = pressed;
    const isHover = hovered && !isDown;
    const cur = isDown ? 1 : isHover ? offset + 1 : offset;
    const trans = isDown ? 2 : isHover ? -1 : 0;

    return {
      transform: [{ translateX: trans }, { translateY: trans }],
      ...(Platform.OS === 'web'
        ? {
            boxShadow: `${cur}px ${cur}px 0px ${shadowColor}`,
            cursor: 'pointer',
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }
        : {
            shadowColor: shadowColor,
            shadowOffset: { width: cur, height: cur },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: cur,
          }),
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
      {showMenu && (
        <Pressable
          onPress={() => {
            console.log('[Navbar] Menu button pressed');
            onMenuPress?.();
          }}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
          style={({ pressed, hovered }) => [
            styles.iconButton,
            {
              backgroundColor: theme.card,
              borderColor: borderColor,
              borderWidth: borderWidth,
            },
            getPressableMotion(pressed, hovered, 3),
          ]}
        >
          <MaterialIcons name="menu" size={24} color={theme.text} />
        </Pressable>
      )}

      {/* Brand Title / Logo */}
      <Pressable
        onPress={() => {
          if (showMenu) {
            navigation.navigate('Home');
          }
        }}
        accessibilityRole={showMenu ? 'button' : 'none'}
        disabled={!showMenu}
        style={styles.logoContainer}
      >
        {({ pressed, hovered }) => (
          <View
            style={[
              styles.brandBadge,
              {
                backgroundColor: theme.primary,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              getPressableMotion(pressed && showMenu, hovered && showMenu, 3),
            ]}
          >
            <Text style={styles.brandText}>ACEIT</Text>
          </View>
        )}
      </Pressable>

      {/* Right Controls: Theme Toggle & Settings */}
      <View style={styles.rightButtons}>
        <Pressable
          onPress={toggleTheme}
          accessibilityLabel="Toggle light and dark mode"
          accessibilityRole="button"
          style={({ pressed, hovered }) => [
            styles.iconButton,
            {
              backgroundColor: theme.card,
              borderColor: borderColor,
              borderWidth: borderWidth,
            },
            getPressableMotion(pressed, hovered, 3),
          ]}
        >
          <MaterialIcons
            name={isDarkMode ? 'light-mode' : 'dark-mode'}
            size={22}
            color={isDarkMode ? '#FCD34D' : '#374151'}
          />
        </Pressable>

        {showSettings && (
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            style={({ pressed, hovered }) => [
              styles.settingsButton,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              getPressableMotion(pressed, hovered, 3),
            ]}
          >
            <MaterialIcons name="settings" size={20} color={theme.text} />
            <Text style={[styles.settingsText, { color: theme.text }]}>SETTINGS</Text>
          </Pressable>
        )}
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
    width: 44,
    height: 44,
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
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 4,
    gap: 6,
  },
  settingsText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
