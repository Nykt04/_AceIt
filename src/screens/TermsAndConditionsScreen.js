import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  CheckBox,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showError } from '../services/notificationService';

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, completeOnboarding } = useAuth();
  const { theme } = useTheme();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('[TermsAndConditions] Screen mounted. isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  const handleAccept = async () => {
    if (!accepted) {
      setAgreeError(true);
      showError('Terms Not Accepted', 'Please click the checkbox to agree to the Terms & Conditions');
      setTimeout(() => setAgreeError(false), 3000);
      return;
    }

    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Onboarding flow - complete onboarding and navigate to LoginSignup
        console.log('[TermsAndConditions] Completing onboarding...');
        await completeOnboarding();
        console.log('[TermsAndConditions] Onboarding completed, navigating to LoginSignup...');
        // Navigate to LoginSignup screen
        navigation.replace('LoginSignup');
      } else {
        // Authenticated user viewing T&C - navigate to Home
        setLoading(false);
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('[TermsAndConditions] Error accepting T&C:', error);
      showError('Error', 'Failed to save acceptance. Please try again.');
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (isAuthenticated) {
      // Just go back if authenticated user
      navigation.goBack();
      return;
    }

    // For onboarding, show a message
    showError(
      'Terms Not Accepted',
      'You must accept the Terms & Conditions to use AceIt. Please click "I Agree" to continue.'
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {isAuthenticated && (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.backButton, { color: theme.primaryAccent }]}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Terms & Conditions</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isAuthenticated ? 'Review our terms' : 'Please read and accept to continue'}
          </Text>
        </View>

        {/* T&C Content */}
        <View style={[styles.contentBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>1. Service Agreement</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            By using Study Buddy, you agree to comply with these terms and conditions. This service is provided as-is for educational purposes to help students create and manage study materials.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>2. User Responsibilities</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            • You are responsible for maintaining the confidentiality of your account credentials{'\n'}
            • You agree not to use the service for any unlawful or harmful purposes{'\n'}
            • You will not upload or share content that infringes on intellectual property rights{'\n'}
            • You agree to use the service in accordance with all applicable laws and regulations
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>3. Content and IP Rights</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            You retain ownership of all content you create in Study Buddy. By uploading content, you grant us a license to use it solely for providing and improving our service. We do not claim ownership of your study materials.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>4. Data Privacy</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We are committed to protecting your personal information. Your data is stored securely and will not be shared with third parties without your consent, except as required by law. For details, please review our Privacy Policy.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>5. Limitation of Liability</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            Study Buddy is provided on an "as-is" basis. We are not liable for any damages resulting from your use of the service. This includes but is not limited to lost data, interruptions, or inaccuracies in AI-generated content.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>6. Acceptable Use</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            You agree not to:
            {'\n'}• Attempt to hack, reverse-engineer, or compromise the service{'\n'}
            • Engage in harassment or bullying{'\n'}
            • Upload viruses, malware, or harmful code{'\n'}
            • Spam or abuse the service{'\n'}
            • Impersonate others or provide false information
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>7. Modifications</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We reserve the right to modify these terms at any time. Continued use of Study Buddy after modifications constitutes acceptance of the updated terms. We will notify users of significant changes.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>8. Termination</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We reserve the right to suspend or terminate your account if you violate these terms or engage in any prohibited conduct.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>9. Contact Us</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            If you have any questions about these terms, please contact us through the Help & Support section in the app.
          </Text>

          <Text style={[styles.lastUpdated, { color: theme.textTertiary }]}>
            Last Updated: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                backgroundColor: accepted ? theme.primaryAccent : theme.secondary,
                borderColor: theme.border,
                borderWidth: agreeError ? 2 : 1,
                borderColor: agreeError ? '#ef4444' : theme.border,
              },
            ]}
            onPress={() => {
              setAccepted(!accepted);
              setAgreeError(false);
            }}
          >
            {accepted && <Text style={[styles.checkmark, { color: theme.background }]}>✓</Text>}
          </TouchableOpacity>
          <Text style={[styles.checkboxLabel, { color: theme.text }]}>
            I have read and agree to the Terms & Conditions
          </Text>
        </View>

        {/* Error Message */}
        {agreeError && !isAuthenticated && (
          <View style={[styles.errorMessage, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
            <Text style={[styles.errorText, { color: '#dc2626' }]}>
              ⚠️ Please agree to the Terms & Conditions to continue
            </Text>
          </View>
        )}

        {/* Buttons */}
        {/* Buttons */}
        <View>
          {!isAuthenticated && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.goBackButton,
                  { backgroundColor: theme.secondary, borderColor: theme.border },
                ]}
                onPress={() => navigation.goBack()}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.continueButton,
                  {
                    backgroundColor: accepted ? theme.primaryAccent : theme.tertiary,
                    opacity: accepted ? 1 : 0.5,
                  },
                ]}
                onPress={handleAccept}
                disabled={!accepted || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    Continue to Login/Signup →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {isAuthenticated && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.goBackButton,
                  { backgroundColor: theme.secondary, borderColor: theme.border },
                ]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.acceptButton,
                  {
                    backgroundColor: theme.primaryAccent,
                  },
                ]}
                onPress={handleAccept}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    I Agree
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    fontSize: 18,
    fontWeight: '600',
    padding: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  contentBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  content: {
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 12,
  },
  lastUpdated: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
    paddingHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
    paddingLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    flexWrap: 'wrap',
    marginLeft: 8,
  },
  errorMessage: {
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  goBackButton: {
    borderWidth: 1,
  },
  acceptButton: {
    borderWidth: 0,
  },
  continueButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
