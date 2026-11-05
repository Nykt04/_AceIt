import React, { useState } from 'react';
import { TextInput, StyleSheet, Platform, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function BrutalInput({
  value,
  onChangeText,
  placeholder,
  style,
  inputStyle,
  ...props
}) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = isFocused ? (theme.primary || '#2563EB') : (theme.border || '#121212');
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  const currentOffset = isFocused ? 3 : 1;
  const webShadow = Platform.OS === 'web' ? {
    boxShadow: `${currentOffset}px ${currentOffset}px 0px ${shadowColor}`,
    outlineStyle: 'none',
  } : {
    shadowColor: shadowColor,
    shadowOffset: { width: currentOffset, height: currentOffset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: currentOffset,
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary || '#767676'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: theme.card || '#FFFFFF',
            borderColor: borderColor,
            borderWidth: borderWidth,
            color: theme.text || '#121212',
          },
          webShadow,
          inputStyle,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default BrutalInput;
