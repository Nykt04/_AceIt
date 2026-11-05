// Neubrutalism Design Tokens
export const BRUTAL_TOKENS = {
  borderWidth: 3,
  borderRadius: 4,
  shadowOffset: 4,
  colors: {
    light: {
      background: '#FFFDF5', // Warm Cream
      card: '#FFFFFF',
      text: '#121212',
      textSecondary: '#4A4A4A',
      textTertiary: '#767676',
      border: '#121212',
      shadow: '#121212',
      primary: '#2563EB', // Electric Cobalt
      brandSecondary: '#FF5722', // Safety Orange
      accent: '#FFDE59', // Cyber Yellow
      success: '#10B981',
      error: '#EF4444',
      muted: '#F4F2EA',
    },
    dark: {
      background: '#121212', // Pitch Black
      card: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#D1D5DB',
      textTertiary: '#9CA3AF',
      border: '#FFFFFF',
      shadow: '#FFFFFF', // High-contrast stark white offset shadow
      primary: '#3B82F6',
      brandSecondary: '#FF7043',
      accent: '#FACC15',
      success: '#34D399',
      error: '#F87171',
      muted: '#2A2A2A',
    }
  }
};

export const LIGHT_THEME = {
  isDark: false,
  // Brutal tokens
  background: BRUTAL_TOKENS.colors.light.background,
  card: BRUTAL_TOKENS.colors.light.card,
  text: BRUTAL_TOKENS.colors.light.text,
  textSecondary: BRUTAL_TOKENS.colors.light.textSecondary,
  textTertiary: BRUTAL_TOKENS.colors.light.textTertiary,
  border: BRUTAL_TOKENS.colors.light.border,
  shadow: BRUTAL_TOKENS.colors.light.shadow,
  primary: BRUTAL_TOKENS.colors.light.primary,
  brandSecondary: BRUTAL_TOKENS.colors.light.brandSecondary,
  accent: BRUTAL_TOKENS.colors.light.accent,
  muted: BRUTAL_TOKENS.colors.light.muted,
  borderWidth: BRUTAL_TOKENS.borderWidth,
  borderRadius: BRUTAL_TOKENS.borderRadius,
  shadowOffset: BRUTAL_TOKENS.shadowOffset,

  // Backward-compatible aliasing for unmigrated screens
  secondary: BRUTAL_TOKENS.colors.light.card,
  tertiary: BRUTAL_TOKENS.colors.light.muted,
  primaryAccent: BRUTAL_TOKENS.colors.light.primary,
  primaryLight: '#60A5FA',
  success: BRUTAL_TOKENS.colors.light.success,
  error: BRUTAL_TOKENS.colors.light.error,
  errorLight: '#FCA5A5',
  errorBg: '#FEE2E2',
  errorBorder: '#FECACA',
};

export const DARK_THEME = {
  isDark: true,
  // Brutal tokens
  background: BRUTAL_TOKENS.colors.dark.background,
  card: BRUTAL_TOKENS.colors.dark.card,
  text: BRUTAL_TOKENS.colors.dark.text,
  textSecondary: BRUTAL_TOKENS.colors.dark.textSecondary,
  textTertiary: BRUTAL_TOKENS.colors.dark.textTertiary,
  border: BRUTAL_TOKENS.colors.dark.border,
  shadow: BRUTAL_TOKENS.colors.dark.shadow,
  primary: BRUTAL_TOKENS.colors.dark.primary,
  brandSecondary: BRUTAL_TOKENS.colors.dark.brandSecondary,
  accent: BRUTAL_TOKENS.colors.dark.accent,
  muted: BRUTAL_TOKENS.colors.dark.muted,
  borderWidth: BRUTAL_TOKENS.borderWidth,
  borderRadius: BRUTAL_TOKENS.borderRadius,
  shadowOffset: BRUTAL_TOKENS.shadowOffset,

  // Backward-compatible aliasing for unmigrated screens
  secondary: BRUTAL_TOKENS.colors.dark.card,
  tertiary: BRUTAL_TOKENS.colors.dark.muted,
  primaryAccent: BRUTAL_TOKENS.colors.dark.primary,
  primaryLight: '#60A5FA',
  success: BRUTAL_TOKENS.colors.dark.success,
  error: BRUTAL_TOKENS.colors.dark.error,
  errorLight: '#FCA5A5',
  errorBg: '#4C2626',
  errorBorder: '#7F1D1D',
};

export default BRUTAL_TOKENS;
