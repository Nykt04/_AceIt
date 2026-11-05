import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import soundManager from '../services/soundService';

export const NotificationDisplay = () => {
  const { notifications, removeNotification } = useNotification();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  return (
    <View
      style={[
        styles.container,
        isDesktop ? styles.desktopContainer : styles.mobileContainer,
      ]}
      pointerEvents="box-none"
    >
      {notifications.map((notification) => (
        <BrutalToast
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </View>
  );
};

const BrutalToast = ({ notification, onDismiss }) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const translateYAnim = useRef(new Animated.Value(-40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const duration = notification.duration || 4000;

  useEffect(() => {
    // Sound on pop out
    try {
      soundManager.playButtonClick();
    } catch (_) {}

    // Spring Pop-Out Sequence
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 110,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 6,
        tension: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Progress bar countdown
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }),
    ]).start();

    // Auto dismiss timer
    const timer = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: -20,
        duration: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getAccentConfig = () => {
    switch (notification.type) {
      case 'error':
        return {
          color: theme.error || '#EF4444',
          badgeText: 'DELETED / ERROR',
          iconName: 'delete-forever',
        };
      case 'success':
        return {
          color: theme.success || '#10B981',
          badgeText: 'SUCCESS / ADDED',
          iconName: 'check-circle',
        };
      case 'warning':
        return {
          color: theme.accent || '#F59E0B',
          badgeText: 'WARNING',
          iconName: 'warning',
        };
      case 'info':
      default:
        return {
          color: theme.primary || '#3B82F6',
          badgeText: 'NOTICE',
          iconName: 'info',
        };
    }
  };

  const config = getAccentConfig();
  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: theme.card,
            borderColor: borderColor,
            borderWidth: borderWidth,
          },
          Platform.OS === 'web' && {
            boxShadow: `5px 5px 0px ${shadowColor}`,
          },
        ]}
      >
        {/* Top Accent Strip */}
        <View
          style={[
            styles.accentStrip,
            {
              backgroundColor: config.color,
              borderBottomColor: borderColor,
              borderBottomWidth: borderWidth,
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <MaterialIcons name={config.iconName} size={16} color="#FFFFFF" />
            <Text style={styles.badgeText}>{config.badgeText}</Text>
          </View>

          <TouchableOpacity
            onPress={dismissToast}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.closeBtn}
            accessibilityLabel="Dismiss notification"
          >
            <MaterialIcons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <View style={styles.toastBody}>
          <Text style={[styles.toastTitle, { color: theme.text }]}>
            {notification.title}
          </Text>
          {notification.message ? (
            <Text style={[styles.toastMessage, { color: theme.textSecondary }]}>
              {notification.message}
            </Text>
          ) : null}
        </View>

        {/* Progress Countdown Bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.muted }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: config.color,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    zIndex: 99999,
    pointerEvents: 'box-none',
  },
  desktopContainer: {
    top: 24,
    right: 24,
    width: 380,
  },
  mobileContainer: {
    top: 16,
    left: 16,
    right: 16,
  },
  toastWrapper: {
    marginBottom: 14,
  },
  toastCard: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  accentStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 2,
    borderRadius: 2,
  },
  toastBody: {
    padding: 14,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  toastMessage: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});

export default NotificationDisplay;
