import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const LIGHT_THEME = {
  isDark: false,
  background: '#ffffff',
  secondary: '#f5f5f5',
  tertiary: '#e8e8e8',
  primaryAccent: '#6366f1',
  primaryLight: '#818cf8',
  text: '#1e293b',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  success: '#10b981',
  error: '#ef4444',
  errorLight: '#fca5a5',
  errorBg: '#fee2e2',
  errorBorder: '#fecaca',
};

const THEME_STORAGE_KEY = '@aceit_theme_preference';

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('[ThemeContext] Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newMode));
    } catch (error) {
      console.error('[ThemeContext] Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
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
