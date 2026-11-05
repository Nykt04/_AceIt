import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import soundManager from '../services/soundService';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function QuizSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { set } = route.params || {};
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const handleStartQuiz = () => {
    if (!set || !set.questions || set.questions.length === 0) {
      return;
    }
    soundManager.playButtonClick();
    const selectedCount = Math.min(numQuestions, set.questions.length);
    navigation.navigate('Study', {
      set: {
        ...set,
        questions: set.questions.slice(0, selectedCount),
      },
      mode: 'quiz',
      settings: {
        numQuestions: selectedCount,
        shuffleQuestions,
        showAnswers,
        timedMode,
        timePerQuestion,
      },
    });
  };

  const maxQuestions = set?.questions?.length || 0;

  if (!set || !set.questions || set.questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Navbar onMenuPress={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyCard,
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
            <MaterialIcons name="error-outline" size={36} color="#EF4444" />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              NO QUESTIONS AVAILABLE
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              This study set does not have questions attached yet. You can generate questions using AI or convert flashcard terms.
            </Text>
            <BrutalButton
              title="← BACK TO DECK"
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
                <Text style={styles.heroBadgeText}>EXAM SIMULATOR // SETTINGS</Text>
              </View>
              <BrutalBadge
                label={`${maxQuestions} QUESTIONS IN DECK`}
                color={theme.primary}
                textColor="#FFFFFF"
              />
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>
              QUIZ CONFIGURATION
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Target: <Text style={{ fontWeight: '800', color: theme.text }}>{set.title}</Text>. Configure question limits, timers, and feedback.
            </Text>
          </View>

          {/* 1. Question Quantity Card */}
          <BrutalCard
            headerTitle="1. NUMBER OF QUESTIONS"
            accentColor={theme.primary}
            style={{ marginBottom: 16 }}
          >
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Select quiz length:
            </Text>
            <View style={styles.chipsRow}>
              {[5, 10, 15, 20, maxQuestions].filter((v, i, a) => v <= maxQuestions && a.indexOf(v) === i).map((count) => {
                const isSelected = numQuestions === count;
                return (
                  <Pressable
                    key={count}
                    onPress={() => {
                      soundManager.playButtonClick();
                      setNumQuestions(count);
                    }}
                    style={({ pressed }) => [
                      styles.chipBtn,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.background,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                        transform: [
                          { translateX: pressed || isSelected ? 2 : 0 },
                          { translateY: pressed || isSelected ? 2 : 0 },
                        ],
                      },
                      Platform.OS === 'web' && {
                        boxShadow: isSelected
                          ? `1px 1px 0px ${shadowColor}`
                          : pressed
                          ? `1px 1px 0px ${shadowColor}`
                          : `3px 3px 0px ${shadowColor}`,
                        cursor: 'pointer',
                        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {count === maxQuestions ? `ALL (${count})` : `${count} Qs`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </BrutalCard>

          {/* 2. Exam Rules Card */}
          <BrutalCard
            headerTitle="2. EXAM RULES & TIMERS"
            accentColor={theme.accent || '#FCD34D'}
            style={{ marginBottom: 20 }}
          >
            {/* Shuffle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Shuffle Questions</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Randomize question order to avoid positional memorization
                </Text>
              </View>
              <Switch
                value={shuffleQuestions}
                onValueChange={(val) => {
                  soundManager.playButtonClick();
                  setShuffleQuestions(val);
                }}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#CBD5E1',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.divider,
                { borderBottomColor: theme.isDark ? '#374151' : '#E2E8F0', borderBottomWidth: 1 },
              ]}
            />

            {/* Instant Answers */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Show Instant Feedback</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Reveal correct answer and explanation right after each choice
                </Text>
              </View>
              <Switch
                value={showAnswers}
                onValueChange={(val) => {
                  soundManager.playButtonClick();
                  setShowAnswers(val);
                }}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#CBD5E1',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.divider,
                { borderBottomColor: theme.isDark ? '#374151' : '#E2E8F0', borderBottomWidth: 1 },
              ]}
            />

            {/* Timed Mode */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Timed Mode</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Countdown clock per question for rapid recall practice
                </Text>
              </View>
              <Switch
                value={timedMode}
                onValueChange={(val) => {
                  soundManager.playButtonClick();
                  setTimedMode(val);
                }}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#CBD5E1',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {timedMode && (
              <View style={styles.timedOptionsBox}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 8 }]}>
                  Seconds per question:
                </Text>
                <View style={styles.chipsRow}>
                  {[15, 30, 45, 60].map((t) => {
                    const isSelected = timePerQuestion === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => {
                          soundManager.playButtonClick();
                          setTimePerQuestion(t);
                        }}
                        style={({ pressed }) => [
                          styles.chipBtn,
                          {
                            backgroundColor: isSelected ? theme.brandSecondary || '#F97316' : theme.background,
                            borderColor: borderColor,
                            borderWidth: 1.5,
                            transform: [
                              { translateX: pressed || isSelected ? 1 : 0 },
                              { translateY: pressed || isSelected ? 1 : 0 },
                            ],
                          },
                          Platform.OS === 'web' && {
                            boxShadow: isSelected
                              ? `1px 1px 0px ${shadowColor}`
                              : `2px 2px 0px ${shadowColor}`,
                            cursor: 'pointer',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipBtnText,
                            { color: isSelected ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {t}s
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </BrutalCard>

          {/* Action Button */}
          <BrutalButton
            title={`START QUIZ NOW (${Math.min(numQuestions, maxQuestions)} QUESTIONS) →`}
            variant="primary"
            icon={<MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />}
            onPress={handleStartQuiz}
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
  scrollContent: {
    paddingBottom: 60,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 500,
    padding: 24,
    borderRadius: 4,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  emptyDesc: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBtnText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 10,
  },
  timedOptionsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
