import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { showError } from '../services/notificationService';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isAuthenticated, completeOnboarding } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  useEffect(() => {
    console.log('[PrivacyPolicy] Screen mounted. isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  const handleAccept = async () => {
    if (!isAuthenticated && !accepted) {
      setAgreeError(true);
      showError('Policy Not Accepted', 'Please click the checkbox to agree to the Privacy Policy');
      setTimeout(() => setAgreeError(false), 3000);
      return;
    }

    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Onboarding flow - complete onboarding and navigate to LoginSignup
        console.log('[PrivacyPolicy] Completing onboarding...');
        await completeOnboarding();
        console.log('[PrivacyPolicy] Onboarding completed, navigating to LoginSignup...');
        navigation.replace('LoginSignup');
      } else {
        // Authenticated user viewing privacy policy - navigate to Home
        setLoading(false);
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('[PrivacyPolicy] Error accepting privacy policy:', error);
      showError('Error', 'Failed to save acceptance. Please try again.');
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (isAuthenticated) {
      navigation.goBack();
      return;
    }

    showError(
      'Policy Not Accepted',
      'You must accept the Privacy Policy to use Study Buddy. Please click "I Agree" to continue.'
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backButton, { color: theme.primaryAccent }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your privacy matters to us
          </Text>
        </View>

        {/* Privacy Policy Content */}
        <View style={[styles.contentBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>1. Information We Collect</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We collect information you provide directly to us, such as:{'\n'}
            • Account information (email, name, password){'\n'}
            • Study materials and flashcards you create{'\n'}
            • Usage data and interaction patterns{'\n'}
            • Device information (device type, OS version){'\n'}
            • Files you upload for processing
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>2. How We Use Your Information</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We use the information we collect to:{'\n'}
            • Provide and improve our Study Buddy service{'\n'}
            • Personalize your learning experience{'\n'}
            • Send important updates and security alerts{'\n'}
            • Generate insights about your study patterns{'\n'}
            • Enhance AI features and recommendations{'\n'}
            • Respond to your support requests
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>3. Data Security</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We implement industry-standard security measures to protect your data, including:{'\n'}
            • End-to-end encryption for sensitive information{'\n'}
            • Secure authentication protocols{'\n'}
            • Regular security audits and updates{'\n'}
            • Access controls and monitoring{'\n'}
            • Compliance with data protection regulations
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>4. Third-Party Services</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            Study Buddy integrates with third-party services solely for providing and improving our service:{'\n'}
            • Supabase for data storage and authentication{'\n'}
            • OpenAI for AI-powered content generation{'\n'}
            • Email services for notifications and password reset{'\n'}
            • Analytics services to understand app usage{'\n'}
            These third parties are bound by confidentiality agreements.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>5. Data Sharing</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We do not sell or trade your personal information. We only share data:{'\n'}
            • With your explicit consent{'\n'}
            • When legally required or for legal protection{'\n'}
            • With service providers who assist us in operations{'\n'}
            • In aggregated, anonymized form for analytics
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>6. User Content Ownership</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            You retain full ownership of all study materials, flashcards, and content you create in Study Buddy. We only use your content to provide the service and do not claim ownership or resell your materials. You can download or delete your content at any time.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>7. Cookies and Tracking</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We use cookies and similar technologies to:{'\n'}
            • Remember your preferences and login status{'\n'}
            • Understand how you use Study Buddy{'\n'}
            • Improve our service performance{'\n'}
            • Detect and prevent fraud{'\n'}
            You can control cookie settings through your device preferences.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>8. Your Rights</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            You have the right to:{'\n'}
            • Access your personal information{'\n'}
            • Correct inaccurate data{'\n'}
            • Request deletion of your data{'\n'}
            • Export your study materials{'\n'}
            • Opt-out of non-essential communications{'\n'}
            To exercise these rights, contact us through Help & Support.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>9. Data Retention</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We retain your personal information for as long as your account is active. If you delete your account, we will securely erase your data within 30 days, except where retention is required by law.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>10. Children's Privacy</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            Study Buddy is not intended for users under 13 years old. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>11. Changes to Privacy Policy</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            We may update this Privacy Policy from time to time to reflect changes in our practices. We will notify you of significant changes. Your continued use of Study Buddy constitutes acceptance of the updated Privacy Policy.
          </Text>

          <Text style={[styles.sectionHeading, { color: theme.primaryAccent }]}>12. Contact Us</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            If you have questions about our Privacy Policy or how we handle your data, please contact us through the Help & Support section in the app.
          </Text>

          <Text style={[styles.lastUpdated, { color: theme.textTertiary }]}>
            Last Updated: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Checkbox (only for onboarding) */}
        {!isAuthenticated && (
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
              I have read and agree to the Privacy Policy
            </Text>
          </View>
        )}

        {/* Error Message */}
        {agreeError && !isAuthenticated && (
          <View style={[styles.errorMessage, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
            <Text style={[styles.errorText, { color: '#dc2626' }]}>
              ⚠️ Please agree to the Privacy Policy to continue
            </Text>
          </View>
        )}

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
                onPress={() => navigation.navigate('TermsAndConditions')}
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
                    I Understand
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
    paddingHorizontal: 0,
    borderBottomWidth: 0,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  errorMessage: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  goBackButton: {
    borderWidth: 1,
  },
  continueButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  acceptButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});
