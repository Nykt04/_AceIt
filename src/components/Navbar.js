import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuPress }) {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleMenuPress = () => {
    console.log('[Navbar] Menu button pressed');
    onMenuPress?.();
  };

  return (
    <View 
      style={[styles.navbar, { backgroundColor: theme.secondary, borderBottomColor: theme.border }]}
    >
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: theme.tertiary }]}
        onPress={handleMenuPress}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <View style={styles.menuButtonInner}>
          <Text style={[styles.menuIcon, { color: theme.text }]} selectable={false}>≣</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.rightButtons}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.tertiary }]}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.navText, { color: theme.text }]} selectable={false}>Settings</Text>
        </TouchableOpacity>
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
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    fontWeight: '700',
    userSelect: 'none',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    
  },
  logoImage: {
    width: 100,
    height: 50,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 44,
  },
  navIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  navText: {
    fontSize: 13,
    fontWeight: '700',
    userSelect: 'none',
  },
});
