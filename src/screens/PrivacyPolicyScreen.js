import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showError } from '../services/notificationService';
import soundManager from '../services/soundService';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isAuthenticated, completeOnboarding } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  useEffect(() => {
    console.log('[PrivacyPolicy] Mounted. isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  const handleAccept = async () => {
    soundManager.playButtonClick();
    if (!isAuthenticated && !accepted) {
      setAgreeError(true);
      showError('Policy Not Accepted', 'Please check the agreement box before proceeding.');
      setTimeout(() => setAgreeError(false), 3000);
      return;
    }

    try {
      if (!isAuthenticated) {
        console.log('[PrivacyPolicy] Completing onboarding and redirecting to Login/Signup...');
        await completeOnboarding();
        navigation.replace('LoginSignup');
      } else {
        navigation.replace('Home');
      }
    } catch (error) {
      showError('Error', 'Failed to complete onboarding: ' + error.message);
    }
  };

  const handleDecline = () => {
    soundManager.playButtonClick();
    if (isAuthenticated) {
      navigation.goBack();
      return;
    }
    showError(
      'Policy Required',
      'You must accept the Privacy Policy to start using AceIt.'
    );
  };

  const SECTIONS = [
    {
      id: '1',
      title: '1. INFORMATION WE COLLECT',
      accent: theme.primary,
      summary: 'Minimal, purposeful collection needed exclusively to sync your study decks.',
      points: [
        'Account Credentials: Email address and encrypted password hash for account auth.',
        'Study Material: Flashcard terms, definitions, quiz questions, and study session tags.',
        'Technical Metrics: Anonymous error logs and performance statistics to keep the app fast.',
      ],
    },
    {
      id: '2',
      title: '2. HOW WE USE YOUR INFORMATION',
      accent: theme.accent || '#FFDE59',
      summary: 'Used solely to power your study experience and AI card generation.',
      points: [
        'Syncing your study sets across web and mobile via Supabase cloud storage.',
        'Processing your uploaded study texts via AI to generate custom quiz questions.',
        'Strictly zero tracking cookies, third-party analytics trackers, or targeted ad networks.',
      ],
    },
    {
      id: '3',
      title: '3. DATA SECURITY & ENCRYPTION',
      accent: theme.brandSecondary || '#FF5722',
      summary: 'Enterprise-grade encryption in transit and at rest.',
      points: [
        'All client-server network requests use TLS 1.3 / SSL encryption.',
        'Database records are hosted on secure PostgreSQL instances with Row-Level Security (RLS).',
        'Your password is never stored in plaintext—only salted one-way hashes.',
      ],
    },
    {
      id: '4',
      title: '4. YOUR RIGHTS & CONTROL',
      accent: theme.success || '#10B981',
      summary: 'You have complete sovereignty over your learning data.',
      points: [
        'Export your sets anytime to PDF or DOCX format with one click.',
        'Edit or permanently delete your cards and decks whenever you choose.',
        'Request complete account and database wipe via Settings > Help & Support.',
      ],
    },
    {
      id: '5',
      title: '5. THIRD-PARTY SHARING POLICY',
      accent: theme.isDark ? '#333333' : '#E5E5E0',
      summary: 'We never sell or broker your personal study data. Period.',
      points: [
        'We do not sell, rent, or monetize your study content to advertisers.',
        'Data is shared only with direct cloud infrastructure providers (Supabase) to store your account.',
        'Zero behavioral surveillance or cross-site tracking.',
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.background,
            borderBottomColor: borderColor,
            borderBottomWidth: borderWidth,
          },
        ]}
      >
        <BrutalButton
          title={isAuthenticated ? 'BACK' : 'TERMS'}
          variant="outline"
          icon={<MaterialIcons name="arrow-back" size={18} color={theme.text} />}
          onPress={() =>
            isAuthenticated ? navigation.goBack() : navigation.navigate('TermsAndConditions')
          }
          style={{ minHeight: 38, paddingVertical: 6, paddingHorizontal: 12 }}
        />
        <BrutalBadge label="DATA TRANSPARENCY" color={theme.primary} textColor="#FFFFFF" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Header Card */}
        <View
          style={[
            styles.heroCard,
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
          <View
            style={[
              styles.heroStripe,
              {
                backgroundColor: theme.brandSecondary || '#FF5722',
                borderBottomColor: borderColor,
                borderBottomWidth: borderWidth,
              },
            ]}
          >
            <MaterialIcons name="security" size={20} color="#FFFFFF" />
            <Text style={styles.heroStripeText}>PRIVACY COMMITMENT</Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>PRIVACY POLICY</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Zero ad trackers. Zero data brokering. Your study sets belong entirely to you.
            </Text>
            <Text style={[styles.heroDate, { color: theme.textTertiary }]}>
              EFFECTIVE DATE: NOVEMBER 2026 • VERSION 2.0
            </Text>
          </View>
        </View>

        {/* Section Cards */}
        {SECTIONS.map((sec) => (
          <BrutalCard
            key={sec.id}
            accentColor={sec.accent}
            headerTitle={sec.title}
            style={{ marginBottom: 14 }}
          >
            <View style={styles.sectionSummaryBox}>
              <Text style={[styles.sectionSummaryText, { color: theme.text }]}>
                {sec.summary}
              </Text>
            </View>
            <View style={styles.pointsList}>
              {sec.points.map((pt, i) => (
                <View key={i} style={styles.pointRow}>
                  <View
                    style={[
                      styles.bulletSquare,
                      { backgroundColor: theme.text, borderColor: borderColor },
                    ]}
                  />
                  <Text style={[styles.pointText, { color: theme.textSecondary }]}>{pt}</Text>
                </View>
              ))}
            </View>
          </BrutalCard>
        ))}

        {/* Agreement Toggle Card */}
        <Pressable
          onPress={() => {
            soundManager.playButtonClick();
            setAccepted(!accepted);
            setAgreeError(false);
          }}
          style={({ pressed }) => [
            styles.agreementCard,
            {
              backgroundColor: theme.card,
              borderColor: agreeError ? '#EF4444' : borderColor,
              borderWidth: borderWidth,
              transform: [
                { translateX: pressed ? 2 : 0 },
                { translateY: pressed ? 2 : 0 },
              ],
            },
            Platform.OS === 'web' && {
              boxShadow: pressed ? `1px 1px 0px ${shadowColor}` : `4px 4px 0px ${shadowColor}`,
              cursor: 'pointer',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            },
          ]}
        >
          <View
            style={[
              styles.checkboxBox,
              {
                backgroundColor: accepted ? (theme.primary || '#2563EB') : theme.background,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
            ]}
          >
            {accepted && <MaterialIcons name="check" size={22} color="#FFFFFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.agreementLabel, { color: theme.text }]}>
              I have read, understood, and accept the Privacy Policy
            </Text>
            <Text style={[styles.agreementSublabel, { color: theme.textSecondary }]}>
              Confirms your agreement before creating your study account.
            </Text>
          </View>
        </Pressable>

        {agreeError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: '#FEE2E2',
                borderColor: '#EF4444',
                borderWidth: borderWidth,
              },
            ]}
          >
            <MaterialIcons name="error" size={20} color="#EF4444" />
            <Text style={styles.errorText}>
              Please check the agreement box above to accept the Privacy Policy.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <BrutalButton
            title={isAuthenticated ? 'CLOSE' : 'DECLINE'}
            variant="outline"
            onPress={handleDecline}
            style={{ flex: 1 }}
          />
          <BrutalButton
            title={isAuthenticated ? 'CONFIRM' : 'ACCEPT & GET STARTED →'}
            variant={accepted || isAuthenticated ? 'primary' : 'secondary'}
            onPress={handleAccept}
            style={{ flex: 2 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  heroCard: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroStripe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  heroStripeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroBody: {
    padding: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 8,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionSummaryBox: {
    marginBottom: 10,
  },
  sectionSummaryText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  pointsList: {
    gap: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletSquare: {
    width: 6,
    height: 6,
    marginTop: 6,
    borderRadius: 1,
  },
  pointText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  agreementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 4,
    gap: 14,
    marginTop: 8,
    marginBottom: 14,
  },
  checkboxBox: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementLabel: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  agreementSublabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 4,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
});
