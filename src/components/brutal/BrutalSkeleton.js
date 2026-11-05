import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function BrutalSkeleton({
  width = '100%',
  height = 80,
  style,
  borderRadius = 4,
  showStripe,
  bordered = true,
  shadowed = true,
  ...props
}) {
  const { theme } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const hasStripe = showStripe !== undefined ? showStripe : height >= 45;

  const webShadow = shadowed && Platform.OS === 'web' ? {
    boxShadow: `3px 3px 0px ${shadowColor}`,
  } : shadowed ? {
    shadowColor: shadowColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  } : {};

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          borderColor: bordered ? borderColor : 'transparent',
          borderWidth: bordered ? borderWidth : 0,
          backgroundColor: theme.isDark ? '#232936' : '#E2E8F0',
          opacity: opacityAnim,
        },
        webShadow,
        style,
      ]}
      {...props}
    >
      {hasStripe && (
        <View
          style={[
            styles.stripePlaceholder,
            {
              backgroundColor: theme.isDark ? '#2E384D' : '#CBD5E1',
              borderBottomColor: borderColor,
              borderBottomWidth: borderWidth,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  stripePlaceholder: {
    height: 16,
    width: '100%',
  },
});

export default BrutalSkeleton;
