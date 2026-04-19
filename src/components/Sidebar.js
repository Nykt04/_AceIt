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
  const slideAnim = React.useRef(new Animated.Value(-width * 0.45)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -width * .5,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

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
        />
      )}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>AceIt</Text>
            <TouchableOpacity onPress={onClose}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  sidebar: {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: width * 0.5, 
  backgroundColor: '#0f172a',
  borderRightWidth: 1,
  borderRightColor: '#334155',
  zIndex: 2,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366f1',
  },
  closeButton: {
    fontSize: 20,
    color: '#94a3b8',
  },
  section: {
  marginBottom: 20,
  paddingHorizontal: 12,
},
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
 menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',        
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginBottom: 8,
  backgroundColor: '#1e293b',
},
  menuIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  infoBox: {
  width: '100%',  
  backgroundColor: '#1e293b',
  borderRadius: 8,
  padding: 12,
  borderLeftWidth: 3,
  borderLeftColor: '#6366f1',
},
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 11,
    color: '#64748b',
  },
  sidebarFooter: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
});
