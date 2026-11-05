import React from 'react';
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
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

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
      accent: theme.brandSecondary || '#FF5722',
    },
    {
      title: 'TACTILE FLASHCARD STUDY',
      desc: 'Active recall training with flip cards and self-assessed ratings for maximum retention.',
      icon: 'style',
      accent: theme.accent || '#FFDE59',
    },
    {
      title: 'EXPORT & PRINT ANYWHERE',
      desc: 'Export your decks to formatted PDF and DOCX documents with one tap to study offline.',
      icon: 'print',
      accent: theme.success || '#10B981',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
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
        <Text style={[styles.logoText, { color: theme.text }]}>ACEIT</Text>
        <BrutalBadge label="VERSION 2.0" color={theme.accent || '#FFDE59'} textColor="#121212" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
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
            <MaterialIcons name="school" size={22} color="#FFFFFF" />
            <Text style={styles.heroStripeText}>STUDY INTELLIGENCE</Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>ABOUT ACEIT</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              AceIt is a high-contrast, brutalist study companion designed to cut out distractions, boost focus, and accelerate memory retention.
            </Text>
          </View>
        </View>

        {/* Feature Cards Grid */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>CORE CAPABILITIES</Text>

        <View style={styles.featuresList}>
          {FEATURES.map((item, idx) => (
            <BrutalCard
              key={idx}
              accentColor={item.accent}
              headerTitle={item.title}
              style={{ marginBottom: 12 }}
            >
              <View style={styles.featureRow}>
                <View
                  style={[
                    styles.featureIconBox,
                    {
                      backgroundColor: item.accent,
                      borderColor: borderColor,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={item.accent === '#FFDE59' ? '#121212' : '#FFFFFF'}
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
            title="NEXT: TERMS & CONDITIONS →"
            variant="primary"
            onPress={() => {
              soundManager.playButtonClick();
              navigation.navigate('TermsAndConditions');
            }}
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
    paddingVertical: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  heroCard: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroStripe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroStripeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroBody: {
    padding: 18,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
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
    lineHeight: 18,
    flex: 1,
  },
  actionSection: {
    marginTop: 8,
  },
});
