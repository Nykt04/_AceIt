import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudyProvider } from './src/context/StudyContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationProvider, useNotification } from './src/context/NotificationContext';
import { setNotificationHandler } from './src/services/notificationService';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NotificationDisplay } from './src/components/NotificationDisplay';
import HomeScreen from './src/screens/HomeScreen';
import CreateSetScreen from './src/screens/CreateSetScreen';
import SetDetailScreen from './src/screens/SetDetailScreen';
import StudyScreen from './src/screens/StudyScreen';
import AIGenerateScreen from './src/screens/AIGenerateScreen';
import AboutScreen from './src/screens/AboutScreen';
import LoginSignupScreen from './src/screens/LoginSignupScreen';
import TermsAndConditionsScreen from './src/screens/TermsAndConditionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import FileUploadQuestionsScreen from './src/screens/FileUploadQuestionsScreen';
import QuizSettingsScreen from './src/screens/QuizSettingsScreen';

const NAVIGATION_STATE_KEY = '@aceit_navigation_state_v1';

const Stack = createNativeStackNavigator();

// Root Navigator - conditionally shows Onboarding, Auth, or App stack
function RootNavigator() {
    const { isAuthenticated, loading, onboardingComplete } = useAuth();
    const { addNotification } = useNotification();
    const [initialState, setInitialState] = useState(undefined);
    const [isReady, setIsReady] = useState(false);
    const navigationRef = React.useRef(null);

    // Initialize notification handler
    useEffect(() => {
      setNotificationHandler(addNotification);
    }, [addNotification]);

    useEffect(() => {
        let mounted = true;
        (async() => {
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

    if (loading || !isReady) {
        return (
            <View style={styles.boot}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <NavigationContainer 
            ref={navigationRef}
            initialState={isAuthenticated ? initialState : undefined} 
            onStateChange={async(state) => {
              if (isAuthenticated) {  
                try {
                  await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
                } catch (e) {
                  console.warn('Failed to save navigation state', e);
                }
              }
            }}
        >
            <Stack.Navigator 
                initialRouteName={!onboardingComplete ? "About" : (isAuthenticated ? "Home" : "LoginSignup")}
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0f172a' },
                    animation: 'slide_from_right',
                    gestureEnabled: !onboardingComplete ? false : true,
                }}
            >
                {/* Onboarding Screens - Only show when onboarding NOT complete */}
                {!onboardingComplete && (
                  <>
                    <Stack.Screen 
                        name="About" 
                        component={AboutScreen}
                        options={{ gestureEnabled: false }}
                    />
                    <Stack.Screen 
                        name="TermsAndConditions" 
                        component={TermsAndConditionsScreen}
                        options={{ gestureEnabled: false }}
                    />
                  </>
                )}

                {/* Auth Screens */}
                <Stack.Screen 
                    name="LoginSignup" 
                    component={LoginSignupScreen}
                    options={{ gestureEnabled: false }}
                />

                {/* App Screens - Only show when authenticated */}
                {isAuthenticated && (
                  <>
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="CreateSet" component={CreateSetScreen} />
                    <Stack.Screen name="SetDetail" component={SetDetailScreen} />
                    <Stack.Screen name="QuizSettings" component={QuizSettingsScreen} />
                    <Stack.Screen name="Study" component={StudyScreen} />
                    <Stack.Screen name="AIGenerate" component={AIGenerateScreen} />
                    <Stack.Screen name="FileUploadQuestions" component={FileUploadQuestionsScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                    <Stack.Screen name="TermsAndConditionsView" component={TermsAndConditionsScreen} />
                  </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <StudyProvider>
                        <NotificationProvider>
                            <StatusBar style="light" />
                            <View style={styles.app}>
                                <RootNavigator />
                                <NotificationDisplay />
                            </View>
                        </NotificationProvider>
                    </StudyProvider>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    boot: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    app: {
        flex: 1,
    },
});