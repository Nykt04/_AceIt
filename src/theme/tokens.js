// Neubrutalism Design Tokens - Eye-Friendly & Balanced Palette
export const BRUTAL_TOKENS = {
  borderWidth: 2,
  borderRadius: 4,
  shadowOffset: 3,
  colors: {
    light: {
      background: '#F8F9FA', // Clean neutral architectural paper (no harsh yellow glare)
      card: '#FFFFFF',
      text: '#111827', // Deep zinc black (clear & comfortable)
      textSecondary: '#4B5563',
      textTertiary: '#9CA3AF',
      border: '#111827', // Crisp solid dark border
      shadow: '#111827', // Crisp solid offset drop shadow
      primary: '#3B82F6', // Clean royal blue
      brandSecondary: '#EA580C', // Warm burnt orange
      accent: '#FDE047', // Soft buttery amber yellow (non-fluorescent)
      success: '#10B981',
      error: '#EF4444',
      muted: '#E5E7EB',
    },
    dark: {
      background: '#0F1117', // Comfortable deep carbon slate (eliminates pitch black eye strain)
      card: '#1A1D24', // Distinct, comfortable elevated card surface
      text: '#F3F4F6', // Clean off-white (prevents harsh white halation)
      textSecondary: '#9CA3AF',
      textTertiary: '#6B7280',
      border: '#374151', // Refined slate border (eliminates blinding white outlines)
      shadow: '#000000', // Real physical depth shadow (eliminates white glowing halos)
      primary: '#60A5FA', // Accessible soft sky/indigo blue
      brandSecondary: '#FB923C', // Softened warm amber
      accent: '#FCD34D',
      success: '#34D399',
      error: '#F87171',
      muted: '#262A34',
    }
  }
};

export const LIGHT_THEME = {
  isDark: false,
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

  // Backward-compatible aliasing
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

  // Backward-compatible aliasing
  secondary: BRUTAL_TOKENS.colors.dark.card,
  tertiary: BRUTAL_TOKENS.colors.dark.muted,
  primaryAccent: BRUTAL_TOKENS.colors.dark.primary,
  primaryLight: '#60A5FA',
  success: BRUTAL_TOKENS.colors.dark.success,
  error: BRUTAL_TOKENS.colors.dark.error,
  errorLight: '#FCA5A5',
  errorBg: '#3E1F1F',
  errorBorder: '#7F1D1D',
};

export default BRUTAL_TOKENS;
