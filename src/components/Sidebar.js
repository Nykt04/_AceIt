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

const { width } = Dimensions.get('window');

export default function Sidebar({ isOpen, onClose }) {
  const navigation = useNavigation();
  const slideAnim = React.useRef(new Animated.Value(-width * 0.5)).current;

  React.useEffect(() => {
    console.log('[Sidebar] isOpen changed to:', isOpen);
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -width * 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  const handleNavigate = (screenName) => {
    navigation.navigate(screenName);
    onClose();
  };

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
          pointerEvents="auto"
        />
      )}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>AceIt</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
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
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Version 1.0.0</Text>
              <Text style={styles.infoSubtext}>Your personal study companion</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <Text style={styles.footerText}>© 2026 AceIt</Text>
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
    zIndex: 999,
    pointerEvents: 'auto',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.5, 
    backgroundColor: '#0f172a',
    borderRightWidth: 2,
    borderRightColor: '#334155',
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
    borderBottomColor: '#334155',
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
    color: '#94a3b8',
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
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#e2e8f0',
  },
  infoBox: {
    width: '100%',  
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 3,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  sidebarFooter: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1.5,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
});
