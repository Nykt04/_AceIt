import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function BrutalSkeleton({
  width = '100%',
  height = 80,
  style,
  borderRadius = 4,
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
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  const webShadow = Platform.OS === 'web' ? {
    boxShadow: `3px 3px 0px ${shadowColor}`,
  } : {
    shadowColor: shadowColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          borderColor: borderColor,
          borderWidth: borderWidth,
          backgroundColor: theme.isDark ? '#2A2A2A' : '#EAE8DE',
          opacity: opacityAnim,
        },
        webShadow,
        style,
      ]}
      {...props}
    >
      <View
        style={[
          styles.stripePlaceholder,
          {
            backgroundColor: theme.isDark ? '#333333' : '#DAD6C9',
            borderBottomColor: borderColor,
            borderBottomWidth: borderWidth,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    marginVertical: 8,
    overflow: 'hidden',
  },
  stripePlaceholder: {
    height: 18,
    width: '100%',
  },
});

export default BrutalSkeleton;
