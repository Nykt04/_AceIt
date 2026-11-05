import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isAuthenticated, user, onboardingComplete, completeOnboarding } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Demo Card Flip State for Interactive Active Recall preview
  const [demoFlipped, setDemoFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const handleFlipDemo = () => {
    soundManager.playButtonClick();
    Animated.spring(flipAnim, {
      toValue: demoFlipped ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    setDemoFlipped(!demoFlipped);
  };

  const handleNavigateScreen = (screenName) => {
    soundManager.playButtonClick();
    if (isAuthenticated) {
      navigation.navigate(screenName);
    } else {
      navigation.navigate('LoginSignup');
    }
  };

  const handleProceedOnboarding = () => {
    soundManager.playButtonClick();
    navigation.navigate('TermsAndConditions');
  };

  const handleSkipOnboarding = async () => {
    soundManager.playButtonClick();
    if (completeOnboarding) {
      await completeOnboarding();
    }
    navigation.navigate('LoginSignup');
  };

  const FEATURES = [
    {
      id: 'ai-generate',
      title: 'AI QUESTION SYNTHESIS',
      desc: 'Enter any topic or concept. AceIt extracts 4-option multiple choice items and true/false drills.',
      icon: 'auto-awesome',
      accent: theme.primary,
      actionLabel: 'OPEN AI GENERATOR →',
      screen: 'AIGenerate',
    },
    {
      id: 'custom-decks',
      title: 'TACTILE DECK STUDIO',
      desc: 'Organize study sets by semester or course. Build terms and definitions with physical card feedback.',
      icon: 'library-books',
      accent: theme.brandSecondary || '#F97316',
      actionLabel: 'CREATE NEW DECK →',
      screen: 'CreateSet',
    },
    {
      id: 'doc-upload',
      title: 'DOCUMENT INGESTION',
      desc: 'Upload class notes, syllabi, or outlines (.txt, .docx, .pdf) to generate quizzes without retyping.',
      icon: 'upload-file',
      accent: theme.success || '#10B981',
      actionLabel: 'UPLOAD STUDY FILE →',
      screen: 'FileUploadQuestions',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                <Text style={styles.heroBadgeText}>ABOUT ACEIT // ARCHITECTURE v2.0</Text>
              </View>
              <BrutalBadge
                label={isAuthenticated ? 'LOGGED IN' : 'TOUR MODE'}
                color={isAuthenticated ? '#10B981' : theme.primary}
                textColor="#FFFFFF"
              />
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>
              RADICAL SIMPLICITY. MAXIMUM RETENTION.
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              AceIt removes distractions, gradients, and sluggish animations. Designed with raw tactile Neubrutalism, solid borders, and instant active-recall study loops.
            </Text>
          </View>

          {/* Interactive Feature: Live Demo Flip Card */}
          <BrutalCard
            headerTitle="INTERACTIVE DEMO: ACTIVE RECALL"
            accentColor={theme.accent || '#FCD34D'}
            style={{ marginBottom: 18 }}
          >
            <Text style={[styles.demoInstruction, { color: theme.textSecondary }]}>
              Click the card below to test the tactile 3D perspective flip:
            </Text>

            <Pressable
              onPress={handleFlipDemo}
              style={({ pressed }) => [
                styles.demoCardBox,
                {
                  backgroundColor: demoFlipped
                    ? (theme.isDark ? '#1E293B' : '#FEF3C7')
                    : (theme.isDark ? '#232936' : '#EFF6FF'),
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                  transform: [
                    { translateX: pressed ? 2 : 0 },
                    { translateY: pressed ? 2 : 0 },
                  ],
                },
                Platform.OS === 'web' && {
                  boxShadow: pressed
                    ? `1px 1px 0px ${shadowColor}`
                    : `4px 4px 0px ${shadowColor}`,
                  cursor: 'pointer',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                },
              ]}
            >
              <View style={styles.demoCardHeader}>
                <View
                  style={[
                    styles.sidePill,
                    {
                      backgroundColor: demoFlipped ? (theme.brandSecondary || '#F97316') : theme.primary,
                      borderColor: borderColor,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={styles.sidePillText}>
                    {demoFlipped ? 'BACK: DEFINITION' : 'FRONT: PROMPT'}
                  </Text>
                </View>
                <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
                  TAP TO FLIP ↻
                </Text>
              </View>

              <Text style={[styles.demoCardContent, { color: theme.text }]}>
                {demoFlipped
                  ? 'Testing yourself to retrieve information actively strengthens neural memory pathways far more than passive re-reading.'
                  : 'What is Active Recall and why is it superior to passive review?'}
              </Text>
            </Pressable>
          </BrutalCard>

          {/* Core Feature Launchpads */}
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            FEATURE LAUNCHPADS
          </Text>

          <View style={styles.featuresList}>
            {FEATURES.map((item) => (
              <BrutalCard
                key={item.id}
                accentColor={item.accent}
                headerTitle={item.title}
                style={{ marginBottom: 14 }}
              >
                <View style={styles.featureRow}>
                  <View
                    style={[
                      styles.featureIconBox,
                      {
                        backgroundColor: item.accent,
                        borderColor: borderColor,
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={24}
                      color={item.accent === '#FCD34D' ? '#121212' : '#FFFFFF'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                      {item.desc}
                    </Text>
                    <Pressable
                      onPress={() => handleNavigateScreen(item.screen)}
                      style={({ pressed }) => [
                        styles.launchBtn,
                        {
                          backgroundColor: item.accent,
                          borderColor: borderColor,
                          borderWidth: 1.5,
                          transform: [
                            { translateX: pressed ? 1 : 0 },
                            { translateY: pressed ? 1 : 0 },
                          ],
                        },
                        Platform.OS === 'web' && {
                          boxShadow: pressed
                            ? `1px 1px 0px ${shadowColor}`
                            : `2px 2px 0px ${shadowColor}`,
                          cursor: 'pointer',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.launchBtnText,
                          { color: item.accent === '#FCD34D' ? '#121212' : '#FFFFFF' },
                        ]}
                      >
                        {item.actionLabel}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </BrutalCard>
            ))}
          </View>

          {/* System Diagnostics & Specs */}
          <BrutalCard
            headerTitle="SYSTEM DIAGNOSTICS & SPECS"
            accentColor={theme.primary}
            style={{ marginBottom: 18 }}
          >
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Text style={[styles.specLabel, { color: theme.textSecondary }]}>ENGINE VERSION:</Text>
                <Text style={[styles.specVal, { color: theme.text }]}>v2.0.0 (Neubrutalism Core)</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={[styles.specLabel, { color: theme.textSecondary }]}>CLIENT PLATFORM:</Text>
                <Text style={[styles.specVal, { color: theme.text }]}>{Platform.OS.toUpperCase()} WEB</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={[styles.specLabel, { color: theme.textSecondary }]}>STORAGE DRIVER:</Text>
                <Text style={[styles.specVal, { color: theme.text }]}>AsyncStorage + Cloud Sync</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={[styles.specLabel, { color: theme.textSecondary }]}>AUTHENTICATION:</Text>
                <Text style={[styles.specVal, { color: theme.text }]}>
                  {user?.email ? user.email : 'Guest Session'}
                </Text>
              </View>
            </View>
          </BrutalCard>

          {/* Action Navigation Matrix */}
          <View style={styles.actionSection}>
            {isAuthenticated ? (
              <View style={{ gap: 12 }}>
                <BrutalButton
                  title="RETURN TO HOME DASHBOARD →"
                  variant="primary"
                  icon={<MaterialIcons name="home" size={20} color="#FFFFFF" />}
                  onPress={() => handleNavigateScreen('Home')}
                />
                <View style={styles.secondaryActionsRow}>
                  <View style={{ flex: 1 }}>
                    <BrutalButton
                      title="HELP & SUPPORT"
                      variant="secondary"
                      onPress={() => navigation.navigate('HelpSupport')}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BrutalButton
                      title="TERMS OF USE"
                      variant="secondary"
                      onPress={() => navigation.navigate('TermsAndConditionsView')}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <BrutalButton
                  title="NEXT: TERMS & CONDITIONS →"
                  variant="primary"
                  icon={<MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />}
                  onPress={handleProceedOnboarding}
                />
                <BrutalButton
                  title="SKIP ONBOARDING → GO TO LOGIN"
                  variant="secondary"
                  onPress={handleSkipOnboarding}
                />
              </View>
            )}
          </View>
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
    marginBottom: 18,
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
    lineHeight: 20,
  },
  demoInstruction: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  demoCardBox: {
    padding: 18,
    borderRadius: 4,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  demoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sidePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  sidePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  tapHint: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  demoCardContent: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  featuresList: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureDesc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 10,
  },
  launchBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 3,
  },
  launchBtnText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    letterSpacing: 0.5,
  },
  specsGrid: {
    gap: 10,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
