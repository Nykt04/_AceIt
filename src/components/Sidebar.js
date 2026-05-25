import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function Sidebar({ isOpen, onClose }) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-width * 0.4)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    console.log('[Sidebar] isOpen changed to:', isOpen);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -width * 0.4,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, slideAnim, opacityAnim]);

  const handleNavigate = (screenName) => {
    navigation.navigate(screenName);
    onClose();
  };

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
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
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme.background,
            borderRightColor: theme.border,
            pointerEvents: isOpen ? 'auto' : 'none',
          },
        ]}
      >
        <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.sidebarHeader, { borderBottomColor: theme.border }]}>
            <Text style={styles.sidebarTitle}>AceIt</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.closeButton, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Navigation</Text>
            <MenuItem
              icon="  "
              label="Home"
              onPress={() => handleNavigate('Home')}
            />
            <MenuItem
              icon=""
              label="AI Generate"
              onPress={() => handleNavigate('AIGenerate')}
            />
            <MenuItem
              icon=""
              label="Upload File"
              onPress={() => handleNavigate('FileUploadQuestions')}
            />
            <MenuItem
              icon=""
              label="Create Set"
              onPress={() => handleNavigate('CreateSet')}
            />
            <MenuItem
              icon=""
              label="About"
              onPress={() => handleNavigate('About')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account</Text>
            <MenuItem
              icon=""
              label="Settings"
              onPress={() => handleNavigate('Settings')}
            />
            <MenuItem
              icon=""
              label="Login / Signup"
              onPress={() => handleNavigate('LoginSignup')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <View style={[styles.infoBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={[styles.infoText, { color: theme.text }]}>Version 1.0.0</Text>
              <Text style={[styles.infoSubtext, { color: theme.textSecondary }]}>Your personal study companion</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.sidebarFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>© 2026 AceIt</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.4, 
    borderRightWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 1000,
    zIndex: 1000,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 12,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#6366f1',
    letterSpacing: 1,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '600',
    padding: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',        
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    width: '100%',  
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  infoSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  sidebarFooter: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1.5,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});
