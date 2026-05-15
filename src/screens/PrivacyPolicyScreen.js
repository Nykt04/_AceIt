import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

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
        <View style={styles.headerSection}>
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

        {/* Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.acceptButton,
              {
                backgroundColor: theme.primaryAccent,
              },
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              I Understand
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 18,
    fontWeight: '600',
    padding: 8,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  lastUpdated: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
