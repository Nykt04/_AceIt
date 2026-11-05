import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Switch,
  Animated,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { generateQuestions } from '../services/aiService';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';
import { showSuccess, showError } from '../services/notificationService';

export default function AIGenerateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const existingSet = route.params?.existingSet;
  const { addStudySet, updateStudySet } = useStudy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [topic, setTopic] = useState(existingSet?.title ?? '');
  const [count, setCount] = useState(5);
  const [customCount, setCustomCount] = useState('');
  const [multipleChoice, setMultipleChoice] = useState(true);
  const [trueFalse, setTrueFalse] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const generate = async () => {
    const t = topic.trim();
    if (!t) {
      setError('Please enter a study topic or concept');
      showError('Required: Enter a study topic');
      return;
    }
    if (!multipleChoice && !trueFalse) {
      setError('Select at least one question type (Multiple Choice or True/False)');
      showError('Select at least one question type');
      return;
    }

    const finalCount = customCount.trim() ? parseInt(customCount, 10) : count;
    if (isNaN(finalCount) || finalCount < 1) {
      setError('Please enter a valid count of questions (1 or more)');
      showError('Invalid number of questions');
      return;
    }
    if (finalCount > 100) {
      setError('Maximum 100 questions allowed per generation');
      showError('Maximum 100 questions allowed');
      return;
    }

    soundManager.playButtonClick();
    setError('');
    setLoading(true);

    try {
      const questions = await generateQuestions(t, finalCount, { multipleChoice, trueFalse });
      const terms = questions.map((q) => ({
        term: q.question || 'Question',
        definition: q.explanation || q.correctAnswer?.toString() || 'Answer',
      }));

      soundManager.playSuccess();

      if (existingSet) {
        const existing = existingSet.questions || [];
        const existingTerms = existingSet.terms || [];
        await updateStudySet(existingSet.id, {
          questions: [...existing, ...questions],
          terms: [...existingTerms, ...terms],
        });
        showSuccess(`Generated ${questions.length} questions for ${existingSet.title}`);
        navigation.navigate('SetDetail', {
          set: {
            ...existingSet,
            questions: [...existing, ...questions],
            terms: [...existingTerms, ...terms],
          },
        });
      } else {
        const newSet = await addStudySet({
          title: t,
          description: 'AI-generated study deck',
          terms,
          questions,
        });
        showSuccess(`Created new deck "${t}" with ${questions.length} questions`);
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (e) {
      setError(e.message || 'Generation failed');
      showError(e.message || 'Could not generate questions. Check API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                <Text style={styles.heroBadgeText}>AI GENERATOR // ACEIT CORE</Text>
              </View>
              {existingSet && (
                <View
                  style={[
                    styles.contextPill,
                    {
                      backgroundColor: theme.primary,
                      borderColor: borderColor,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={styles.contextPillText}>APPENDING TO: {existingSet.title}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>
              GENERATE STUDY QUESTIONS
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Enter any concept or curriculum chapter. The engine synthesizes questions and flashcards.
            </Text>
          </View>

          {/* Error Message Box */}
          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: theme.isDark ? '#451A1A' : '#FEE2E2',
                  borderColor: theme.error || '#EF4444',
                  borderWidth: borderWidth,
                },
                Platform.OS === 'web' && {
                  boxShadow: `3px 3px 0px ${shadowColor}`,
                },
              ]}
            >
              <MaterialIcons name="warning" size={22} color={theme.error || '#EF4444'} />
              <Text style={[styles.errorText, { color: theme.isDark ? '#FCA5A5' : '#B91C1C' }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* 1. Study Topic Section */}
          <BrutalCard
            headerTitle="1. STUDY TOPIC OR CONCEPT"
            accentColor={theme.primary}
            style={{ marginBottom: 16 }}
          >
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              What subject or chapter are you preparing for?
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
                Platform.OS === 'web' && {
                  boxShadow: `2px 2px 0px ${shadowColor}`,
                },
              ]}
              placeholder="e.g. Cellular Respiration, Operating Systems, Spanish Verbs..."
              placeholderTextColor={theme.textTertiary || '#9CA3AF'}
              value={topic}
              onChangeText={setTopic}
              editable={!existingSet && !loading}
            />
          </BrutalCard>

          {/* 2. Number of Questions Section */}
          <BrutalCard
            headerTitle="2. QUANTITY OF QUESTIONS"
            accentColor={theme.accent || '#FCD34D'}
            style={{ marginBottom: 16 }}
          >
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Select preset amount:
            </Text>
            <View style={styles.presetsGrid}>
              {[3, 5, 10, 15, 20].map((n) => {
                const isSelected = count === n && !customCount.trim();
                return (
                  <Pressable
                    key={n}
                    onPress={() => {
                      soundManager.playButtonClick();
                      setCount(n);
                      setCustomCount('');
                    }}
                    style={({ pressed }) => [
                      styles.presetBtn,
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
                        styles.presetBtnText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {n} ITEMS
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.customCountContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 8 }]}>
                Or enter custom count:
              </Text>
              <TextInput
                style={[
                  styles.customCountInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    color: theme.text,
                  },
                  Platform.OS === 'web' && {
                    boxShadow: `2px 2px 0px ${shadowColor}`,
                  },
                ]}
                placeholder="Custom number (e.g. 25, 50)"
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={customCount}
                onChangeText={(text) => {
                  setCustomCount(text);
                  const parsed = parseInt(text, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    setCount(parsed);
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
                editable={!loading}
              />
            </View>
          </BrutalCard>

          {/* 3. Question Formats Section */}
          <BrutalCard
            headerTitle="3. QUESTION FORMATS"
            accentColor={theme.brandSecondary || '#F97316'}
            style={{ marginBottom: 20 }}
          >
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>Multiple Choice</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  4 answer options with detailed explanation
                </Text>
              </View>
              <Switch
                value={multipleChoice}
                onValueChange={(val) => {
                  soundManager.playButtonClick();
                  setMultipleChoice(val);
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

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: theme.text }]}>True / False</Text>
                <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                  Rapid concept validation statements
                </Text>
              </View>
              <Switch
                value={trueFalse}
                onValueChange={(val) => {
                  soundManager.playButtonClick();
                  setTrueFalse(val);
                }}
                trackColor={{
                  false: theme.isDark ? '#374151' : '#CBD5E1',
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </BrutalCard>

          {/* Action Button */}
          <BrutalButton
            title={loading ? 'SYNTHESIZING QUESTIONS...' : 'GENERATE QUESTIONS WITH AI'}
            variant="primary"
            icon={<MaterialIcons name="auto-awesome" size={22} color="#FFFFFF" />}
            onPress={generate}
            disabled={loading}
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
  contextPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  contextPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  presetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  customCountContainer: {
    marginTop: 4,
  },
  customCountInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
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
});
