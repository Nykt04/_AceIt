import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Navbar({ onMenuPress }) {
  const navigation = useNavigation();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <Text style={styles.menuIcon}>≣</Text>
      </TouchableOpacity>
      <Text style={styles.logo}>AceIt</Text>
      <View style={styles.rightButtons}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}></Text>
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('LoginSignup')}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}></Text>
          <Text style={styles.navText}>Login</Text>
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
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  menuIcon: {
    fontSize: 18,
    color: '#e2e8f0',
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366f1',
    flex: 1,
    textAlign: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  navIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  navText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
});
