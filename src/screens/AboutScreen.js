import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const FEATURES = [
    {
      title: 'AI QUESTION GENERATION',
      desc: 'Upload class notes or enter key topics. The engine extracts flashcards and high-yield quiz questions.',
      icon: 'auto-awesome',
      accent: theme.primary,
    },
    {
      title: 'CUSTOM DECK ARCHITECTURE',
      desc: 'Organize study sets by semester, course, or exam. Edit and update terms with physical card mechanics.',
      icon: 'library-books',
      accent: theme.brandSecondary || '#F97316',
    },
    {
      title: 'TACTILE FLASHCARD STUDY',
      desc: 'Active recall training with 3D flip cards and self-assessed ratings for maximum retention.',
      icon: 'style',
      accent: theme.accent || '#FCD34D',
    },
    {
      title: 'DOCUMENT & NOTES INGESTION',
      desc: 'Extract questions directly from .txt and .docx notes with zero tedious retyping.',
      icon: 'upload-file',
      accent: theme.success || '#10B981',
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
                <Text style={styles.heroBadgeText}>ABOUT ACEIT // v2.0</Text>
              </View>
              <BrutalBadge
                label="TACTILE STUDY ENGINE"
                color={theme.primary}
                textColor="#FFFFFF"
              />
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>
              RADICAL SIMPLICITY. MAXIMUM RECALL.
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              AceIt cuts out distracting animations, soft gradients, and sluggish menus in favor of raw tactile feedback, solid borders, and instant active-recall testing.
            </Text>
          </View>

          {/* Feature Cards Grid */}
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            CORE ARCHITECTURE
          </Text>

          <View style={styles.featuresList}>
            {FEATURES.map((item, idx) => (
              <BrutalCard
                key={idx}
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
                  <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                    {item.desc}
                  </Text>
                </View>
              </BrutalCard>
            ))}
          </View>

          {/* Action Button */}
          <View style={styles.actionSection}>
            <BrutalButton
              title="EXPLORE TERMS & POLICIES →"
              variant="secondary"
              onPress={() => {
                soundManager.playButtonClick();
                navigation.navigate('TermsAndConditionsView');
              }}
            />
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
    marginBottom: 20,
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
    alignItems: 'center',
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
    lineHeight: 20,
    flex: 1,
  },
  actionSection: {
    marginTop: 8,
  },
});
