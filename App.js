import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudyProvider } from './src/context/StudyContext';
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

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState(undefined);

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
    <StudyProvider>
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
          <Stack.Screen name="LoginSignup" component={LoginSignupScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </StudyProvider>
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
