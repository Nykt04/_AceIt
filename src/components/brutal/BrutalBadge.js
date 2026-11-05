import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function BrutalBadge({
  label,
  color,
  textColor,
  style,
  textStyle,
  ...props
}) {
  const { theme } = useTheme();

  const badgeBg = color || theme.accent || '#FFDE59';
  const borderColor = theme.border || '#121212';
  const labelColor = textColor || (theme.isDark && color ? '#FFFFFF' : '#121212');

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeBg,
          borderColor: borderColor,
          borderWidth: 2,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          { color: labelColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

export default BrutalBadge;
