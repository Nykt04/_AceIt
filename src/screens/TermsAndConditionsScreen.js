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

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [accepted, setAccepted] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  useEffect(() => {
    console.log('[TermsAndConditions] Mounted. isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  const handleAccept = () => {
    soundManager.playButtonClick();
    if (!accepted && !isAuthenticated) {
      setAgreeError(true);
      showError('Terms Not Accepted', 'Please check the agreement box before proceeding.');
      setTimeout(() => setAgreeError(false), 3000);
      return;
    }

    if (!isAuthenticated) {
      navigation.navigate('PrivacyPolicy');
    } else {
      navigation.replace('Home');
    }
  };

  const handleDecline = () => {
    soundManager.playButtonClick();
    if (isAuthenticated) {
      navigation.goBack();
      return;
    }
    showError(
      'Terms Required',
      'You must accept the Terms & Conditions to use AceIt.'
    );
  };

  const SECTIONS = [
    {
      id: '1',
      title: '1. SERVICE PURPOSE & FAIR USE',
      accent: theme.primary,
      summary: 'AceIt is an educational study engine built for student success.',
      points: [
        'Study materials, decks, and tests created are for personal learning and exam prep.',
        'You agree not to use AceIt for academic dishonesty, unauthorized test sharing, or exam cheating.',
        'The platform is provided as-is with continuous reliability and performance updates.',
      ],
    },
    {
      id: '2',
      title: '2. USER CONTENT & OWNERSHIP',
      accent: theme.accent || '#FFDE59',
      summary: 'You retain 100% full intellectual property ownership of your decks.',
      points: [
        'All flashcards, questions, and notes you create remain entirely your property.',
        'We do not sell, license, or claim ownership over your uploaded study data.',
        'You are responsible for ensuring your uploads do not violate third-party copyrights.',
      ],
    },
    {
      id: '3',
      title: '3. AI-GENERATED CONTENT ADVISORY',
      accent: theme.brandSecondary || '#FF5722',
      summary: 'AI question generation is an assistant tool, not an infallible authority.',
      points: [
        'AI extracts and generates flashcards based on your provided study material.',
        'Always review and verify critical formulas, dates, and definitions before exams.',
        'AceIt is not liable for academic grade outcomes resulting from unverified AI cards.',
      ],
    },
    {
      id: '4',
      title: '4. ACCOUNT SECURITY & PRIVACY',
      accent: theme.success || '#10B981',
      summary: 'Your account and data are secured with industry-standard encryption.',
      points: [
        'Keep your account credentials confidential and report any unauthorized access immediately.',
        'Study sets are synced securely using encrypted Supabase PostgreSQL storage.',
        'For details on data collection and retention, consult our Privacy Policy.',
      ],
    },
    {
      id: '5',
      title: '5. ACCEPTABLE CONDUCT & PROHIBITIONS',
      accent: theme.isDark ? '#333333' : '#E5E5E0',
      summary: 'Strict zero-tolerance policy for abuse, exploitation, or malicious activity.',
      points: [
        'No automated scraping, denial-of-service attempts, or reverse-engineering.',
        'No uploading malicious scripts, viruses, or offensive content.',
        'Violations result in immediate suspension or permanent account termination.',
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
          title={isAuthenticated ? 'BACK' : 'ABOUT'}
          variant="outline"
          icon={<MaterialIcons name="arrow-back" size={18} color={theme.text} />}
          onPress={() => (isAuthenticated ? navigation.goBack() : navigation.navigate('About'))}
          style={{ minHeight: 38, paddingVertical: 6, paddingHorizontal: 12 }}
        />
        <BrutalBadge label="LEGAL CONTRACT" color={theme.accent || '#FFDE59'} textColor="#121212" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Header */}
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
                backgroundColor: theme.primary,
                borderBottomColor: borderColor,
                borderBottomWidth: borderWidth,
              },
            ]}
          >
            <MaterialIcons name="gavel" size={20} color="#FFFFFF" />
            <Text style={styles.heroStripeText}>TERMS OF SERVICE</Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>TERMS & CONDITIONS</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Please review the AceIt terms governing your study decks, data ownership, and fair use.
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
              I have read, understood, and accept the Terms & Conditions
            </Text>
            <Text style={[styles.agreementSublabel, { color: theme.textSecondary }]}>
              Mandatory to create, sync, and study decks with AceIt.
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
              Please check the agreement box above to accept the terms.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <BrutalButton
            title={isAuthenticated ? "CLOSE" : "DECLINE"}
            variant="outline"
            onPress={handleDecline}
            style={{ flex: 1 }}
          />
          <BrutalButton
            title={isAuthenticated ? "CONFIRM" : "ACCEPT & CONTINUE →"}
            variant={accepted || isAuthenticated ? "primary" : "secondary"}
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
