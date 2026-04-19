import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudyProvider } from './src/context/StudyContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import CreateSetScreen from './src/screens/CreateSetScreen';
import SetDetailScreen from './src/screens/SetDetailScreen';
import StudyScreen from './src/screens/StudyScreen';
import AIGenerateScreen from './src/screens/AIGenerateScreen';
import AboutScreen from './src/screens/AboutScreen';
import LoginSignupScreen from './src/screens/LoginSignupScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FileUploadQuestionsScreen from './src/screens/FileUploadQuestionsScreen';
import QuizSettingsScreen from './src/screens/QuizSettingsScreen';

const NAVIGATION_STATE_KEY = '@aceit_navigation_state_v1';

const Stack = createNativeStackNavigator();

// Auth Stack - shown when user is not authenticated
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f172a' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="LoginSignup" component={LoginSignupScreen} />
    </Stack.Navigator>
  );
}

// App Stack - shown when user is authenticated
function AppStack() {
  const [initialState, setInitialState] = useState(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw);
          setInitialState(parsed);
        }
      } catch (e) {
        console.warn('Failed to restore navigation state', e);
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={async (state) => {
        try {
          await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
        } catch (e) {
          console.warn('Failed to save navigation state', e);
        }
      }}
    >
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f172a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateSet" component={CreateSetScreen} />
        <Stack.Screen name="SetDetail" component={SetDetailScreen} />
        <Stack.Screen name="QuizSettings" component={QuizSettingsScreen} />
        <Stack.Screen name="Study" component={StudyScreen} />
        <Stack.Screen name="AIGenerate" component={AIGenerateScreen} />
        <Stack.Screen name="FileUploadQuestions" component={FileUploadQuestionsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Root Navigator - conditionally shows Auth or App stack
function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <StudyProvider>
        <RootNavigator />
      </StudyProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
