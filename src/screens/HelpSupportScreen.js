import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';
import { showSuccess, showError } from '../services/notificationService';

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const email = 'giankarloreguindin811@gmail.com';

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      showError('Please enter a message subject');
      return;
    }
    if (!message.trim()) {
      showError('Please write your message or bug report');
      return;
    }

    soundManager.playButtonClick();
    setLoading(true);

    try {
      const subjectEncoded = encodeURIComponent(subject || 'Support Request - AceIt');
      const messageEncoded = encodeURIComponent(message || 'Hi, I need help with...');
      const mailtoURL = `mailto:${email}?subject=${subjectEncoded}&body=${messageEncoded}`;
      const canOpen = await Linking.canOpenURL(mailtoURL);

      if (canOpen) {
        await Linking.openURL(mailtoURL);
        showSuccess('Opened your mail client');
        setSubject('');
        setMessage('');
      } else {
        Alert.alert(
          'Email Support Directly',
          `Contact our support desk at:\n${email}\n\nSubject: ${subject}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      showError('Unable to open email client');
    } finally {
      setLoading(false);
    }
  };

  const FAQS = [
    {
      q: 'How do I create or import a study deck?',
      a: 'Tap "+ NEW SET" from your dashboard or open the navigation menu and select "CREATE SET" or "UPLOAD QUESTIONS" for documents.',
    },
    {
      q: 'How does AI question generation work?',
      a: 'The AceIt AI engine analyzes your topic or lecture text, extracting key concepts into 4-option multiple-choice items and rapid true/false drills.',
    },
    {
      q: 'Are my decks synced in the cloud?',
      a: 'Yes, your decks automatically persist to your account and local storage so your revision history is always ready.',
    },
    {
      q: 'How do I review flashcards with tactile feedback?',
      a: 'Open any deck and tap "START FLASHCARD STUDY". Cards flip on click with instant 3D perspective physics.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* Hero Banner */}
            <View
              style={[
                styles.heroBanner,
                {
                  backgroundColor: theme.card,
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                },
                Platform.OS === 'web' && {
                  boxShadow: `4px 4px 0px ${shadowColor}`,
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.heroBadge,
                    {
                      backgroundColor: theme.accent || '#FCD34D',
                      borderColor: borderColor,
                      borderWidth: borderWidth,
                    },
                  ]}
                >
                  <Text style={styles.heroBadgeText}>SUPPORT DESK // FAQ & CONTACT</Text>
                </View>
                <BrutalBadge
                  label="DIRECT RESPONSE"
                  color={theme.primary}
                  textColor="#FFFFFF"
                />
              </View>

              <Text style={[styles.heroTitle, { color: theme.text }]}>
                HELP & DOCUMENTATION
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Browse answers to common questions or dispatch a message directly to our engineering desk.
              </Text>
            </View>

            {/* Direct Contact Card */}
            <BrutalCard
              headerTitle="DIRECT DESK CONTACT"
              accentColor={theme.primary}
              style={{ marginBottom: 16 }}
            >
              <View style={styles.emailStrip}>
                <MaterialIcons name="email" size={24} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emailLabel, { color: theme.textSecondary }]}>
                    OFFICIAL SUPPORT EMAIL:
                  </Text>
                  <Text style={[styles.emailText, { color: theme.text }]}>{email}</Text>
                </View>
              </View>
            </BrutalCard>

            {/* FAQs Section */}
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              FREQUENTLY ASKED QUESTIONS
            </Text>

            <View style={styles.faqList}>
              {FAQS.map((faq, idx) => (
                <BrutalCard
                  key={idx}
                  headerTitle={`FAQ #${idx + 1}`}
                  accentColor={theme.accent || '#FCD34D'}
                  style={{ marginBottom: 12 }}
                >
                  <Text style={[styles.faqQuestion, { color: theme.text }]}>
                    {faq.q}
                  </Text>
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                    {faq.a}
                  </Text>
                </BrutalCard>
              ))}
            </View>

            {/* Message Form Card */}
            <BrutalCard
              headerTitle="SEND US A MESSAGE"
              accentColor={theme.brandSecondary || '#F97316'}
              style={{ marginBottom: 20 }}
            >
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Subject:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    color: theme.text,
                  },
                ]}
                placeholder="e.g. Bug with DOCX import, Feature suggestion..."
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                Your Message:
              </Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    color: theme.text,
                  },
                ]}
                placeholder="Describe your issue or feedback in detail..."
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
              />

              <BrutalButton
                title={loading ? 'DISPATCHING...' : 'DISPATCH MESSAGE →'}
                variant="primary"
                icon={<MaterialIcons name="send" size={20} color="#FFFFFF" />}
                onPress={handleSendEmail}
                disabled={loading}
                style={{ marginTop: 14 }}
              />
            </BrutalCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  emailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emailLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  faqList: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  textAreaInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
