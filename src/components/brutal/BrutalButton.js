import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, Platform, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function BrutalButton({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'accent', 'outline', 'danger'
  icon,
  disabled = false,
  style,
  textStyle,
  children,
  ...props
}) {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundColor = () => {
    if (disabled) return theme.isDark ? '#2A2A2A' : '#E5E5E0';
    switch (variant) {
      case 'primary':
        return theme.primary || '#2563EB';
      case 'secondary':
        return theme.brandSecondary || '#FF5722';
      case 'accent':
        return theme.accent || '#FFDE59';
      case 'danger':
        return theme.error || '#EF4444';
      case 'outline':
      default:
        return theme.card || '#FFFFFF';
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textTertiary || '#767676';
    if (variant === 'accent') return '#121212';
    if (variant === 'primary' || variant === 'secondary' || variant === 'danger') return '#FFFFFF';
    return theme.text || '#121212';
  };

  const shadowColor = theme.shadow || '#121212';
  const borderColor = theme.border || '#121212';
  const borderWidth = theme.borderWidth || 3;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => {
        const isDown = pressed && !disabled;
        const currentOffset = isDown ? 1 : 3;

        const webShadow = Platform.OS === 'web' ? {
          boxShadow: `${currentOffset}px ${currentOffset}px 0px ${shadowColor}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        } : {
          shadowColor: shadowColor,
          shadowOffset: { width: currentOffset, height: currentOffset },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: currentOffset,
        };

        return [
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: borderColor,
            borderWidth: borderWidth,
            transform: [
              { translateX: isDown ? 2 : 0 },
              { translateY: isDown ? 2 : 0 },
            ],
          },
          webShadow,
          style,
        ];
      }}
      {...props}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        {title ? (
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default BrutalButton;
