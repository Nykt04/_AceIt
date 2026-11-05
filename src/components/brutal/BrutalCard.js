import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function BrutalCard({
  children,
  style,
  accentColor,
  headerTitle,
  shadowOffset = 4,
  ...props
}) {
  const { theme } = useTheme();

  const shadowColor = theme.shadow || '#121212';
  const borderColor = theme.border || '#121212';
  const cardBg = theme.card || '#FFFFFF';

  const webShadowStyle = Platform.OS === 'web' ? {
    boxShadow: `${shadowOffset}px ${shadowOffset}px 0px ${shadowColor}`,
  } : {
    shadowColor: shadowColor,
    shadowOffset: { width: shadowOffset, height: shadowOffset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: shadowOffset,
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
          borderWidth: theme.borderWidth || 3,
        },
        webShadowStyle,
        style,
      ]}
      {...props}
    >
      {accentColor && (
        <View
          style={[
            styles.accentStripe,
            {
              backgroundColor: accentColor,
              borderBottomColor: borderColor,
              borderBottomWidth: theme.borderWidth || 3,
            },
          ]}
        >
          {headerTitle && (
            <Text
              style={[
                styles.headerText,
                { color: theme.isDark ? '#FFFFFF' : '#121212' },
              ]}
              numberOfLines={1}
            >
              {headerTitle}
            </Text>
          )}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  accentStripe: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    padding: 14,
  },
});

export default BrutalCard;
