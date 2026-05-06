import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

const DARK_THEME = {
  isDark: true,
  background: '#0f172a',
  secondary: '#1e293b',
  tertiary: '#334155',
  primaryAccent: '#6366f1',
  primaryLight: '#818cf8',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: '#334155',
  success: '#10b981',
  error: '#ef4444',
  errorLight: '#fca5a5',
  errorBg: '#4c2626',
  errorBorder: '#7f1d1d',
};

export function ThemeProvider({ children }) {
  // Always use dark mode - no theme switching
  const theme = DARK_THEME;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode: true, isLoading: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
