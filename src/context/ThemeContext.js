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
  background: '#f8fafc',
  secondary: '#f1f5f9',
  tertiary: '#e2e8f0',
  primaryAccent: '#6366f1',
  primaryLight: '#818cf8',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  border: '#cbd5e1',
  success: '#10b981',
  error: '#ef4444',
  errorLight: '#fca5a5',
  errorBg: '#fee2e2',
  errorBorder: '#fecaca',
};

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('[ThemeContext] Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference when it changes
  const toggleTheme = async (value) => {
    try {
      setIsDarkMode(value);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(value));
    } catch (error) {
      console.error('[ThemeContext] Error saving theme:', error);
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
