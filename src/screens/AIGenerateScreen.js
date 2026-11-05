import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Switch,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import {
  generateStudyDeck,
  generateQuestions,
  generateFlashcards,
} from '../services/aiService';
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

  // Generation Mode: 'deck' (both), 'quiz' (questions only), 'flashcards' (cards only)
  const [mode, setMode] = useState('deck');
  const [difficulty, setDifficulty] = useState('intermediate');

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

    if (mode === 'quiz' && !multipleChoice && !trueFalse) {
      setError('Select at least one question type (Multiple Choice or True/False)');
      showError('Select at least one question type');
      return;
    }

    const finalCount = customCount.trim() ? parseInt(customCount, 10) : count;
    if (isNaN(finalCount) || finalCount < 1) {
      setError('Please enter a valid count (1 or more)');
      showError('Invalid number of items');
      return;
    }
    if (finalCount > 50) {
      setError('Maximum 50 items allowed per generation');
      showError('Maximum 50 items allowed');
      return;
    }

    soundManager.playButtonClick();
    setError('');
    setLoading(true);

    try {
      let generatedQuestions = [];
      let generatedTerms = [];
      let deckTitle = t;

      if (mode === 'deck') {
        const result = await generateStudyDeck(t, {
          questionCount: finalCount,
          flashcardCount: finalCount,
          difficulty,
        });
        generatedQuestions = result.questions || [];
        generatedTerms = result.flashcards || [];
        if (result.title) deckTitle = result.title;
      } else if (mode === 'quiz') {
        generatedQuestions = await generateQuestions(
          t,
          finalCount,
          { multipleChoice, trueFalse },
          difficulty
        );
        generatedTerms = generatedQuestions.map((q, i) => ({
          id: `t-gen-${i}`,
          term: q.type === 'true_false' ? `Concept #${i + 1}` : (q.options?.[q.correctIndex] || `Key Term #${i + 1}`),
          definition: q.explanation || q.question,
        }));
      } else {
        // flashcards only
        generatedTerms = await generateFlashcards(t, finalCount);
      }

      soundManager.playSuccess();

      if (existingSet) {
        const existingQ = existingSet.questions || [];
        const existingT = existingSet.terms || [];
        const updatedQ = [...existingQ, ...generatedQuestions];
        const updatedT = [...existingT, ...generatedTerms];

        await updateStudySet(existingSet.id, {
          questions: updatedQ,
          terms: updatedT,
        });

        showSuccess(`Added ${generatedQuestions.length + generatedTerms.length} items to ${existingSet.title}`);
        navigation.navigate('SetDetail', {
          set: {
            ...existingSet,
            questions: updatedQ,
            terms: updatedT,
          },
        });
      } else {
        const newSet = await addStudySet({
          title: deckTitle,
          description: `AI-generated ${mode.toUpperCase()} deck (${difficulty})`,
          terms: generatedTerms,
          questions: generatedQuestions,
        });

        showSuccess(
          `Created "${deckTitle}" (${generatedTerms.length} cards, ${generatedQuestions.length} questions)`
        );
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (e) {
      setError(e.message || 'Generation failed');
      showError(e.message || 'Generation failed. Check your OpenRouter key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
              GENERATE STUDY DECK
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Synthesize flashcards, quiz questions, and conceptual explanations from any topic in seconds.
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

          {/* Generation Mode Selector */}
          <BrutalCard
            headerTitle="1. CHOOSE DECK FORMAT"
            accentColor={theme.primary}
            style={{ marginBottom: 16 }}
          >
            <View style={styles.modeGrid}>
              {[
                { id: 'deck', title: 'FULL STUDY DECK', desc: 'Flashcards + Quiz Questions', badge: 'RECOMMENDED' },
                { id: 'quiz', title: 'QUIZ QUESTIONS ONLY', desc: 'Multiple Choice & True/False' },
                { id: 'flashcards', title: 'FLASHCARDS ONLY', desc: 'Key Terms & Definitions' },
              ].map((m) => {
                const isSelected = mode === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      soundManager.playButtonClick();
                      setMode(m.id);
                    }}
                    style={({ pressed }) => [
                      styles.modeCard,
                      {
                        backgroundColor: isSelected
                          ? (theme.isDark ? '#232936' : '#EFF6FF')
                          : theme.background,
                        borderColor: isSelected ? theme.primary : borderColor,
                        borderWidth: isSelected ? 3 : borderWidth,
                        transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
                      },
                      Platform.OS === 'web' && {
                        boxShadow: isSelected
                          ? `3px 3px 0px ${theme.primary}`
                          : `2px 2px 0px ${shadowColor}`,
                        cursor: 'pointer',
                      },
                    ]}
                  >
                    <View style={styles.modeCardHeader}>
                      <Text
                        style={[
                          styles.modeCardTitle,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {m.title}
                      </Text>
                      {m.badge && (
                        <BrutalBadge
                          label={m.badge}
                          color={theme.accent || '#FCD34D'}
                          textColor="#121212"
                        />
                      )}
                    </View>
                    <Text style={[styles.modeCardDesc, { color: theme.textSecondary }]}>
                      {m.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </BrutalCard>

          {/* Study Topic Section */}
          <BrutalCard
            headerTitle="2. STUDY TOPIC OR CONCEPT"
            accentColor={theme.accent || '#FCD34D'}
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
              placeholder="e.g. Operating Systems, Cellular Respiration, React Hooks..."
              placeholderTextColor={theme.textTertiary || '#9CA3AF'}
              value={topic}
              onChangeText={setTopic}
              editable={!existingSet && !loading}
            />
          </BrutalCard>

          {/* Academic Level / Difficulty Section */}
          <BrutalCard
            headerTitle="3. ACADEMIC DIFFICULTY"
            accentColor={theme.brandSecondary || '#F97316'}
            style={{ marginBottom: 16 }}
          >
            <View style={styles.presetsGrid}>
              {[
                { id: 'beginner', label: 'BEGINNER' },
                { id: 'intermediate', label: 'INTERMEDIATE' },
                { id: 'advanced', label: 'ADVANCED' },
              ].map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <Pressable
                    key={diff.id}
                    onPress={() => {
                      soundManager.playButtonClick();
                      setDifficulty(diff.id);
                    }}
                    style={({ pressed }) => [
                      styles.presetBtn,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.background,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                        transform: [{ translateX: pressed || isSelected ? 2 : 0 }, { translateY: pressed || isSelected ? 2 : 0 }],
                      },
                      Platform.OS === 'web' && {
                        boxShadow: isSelected
                          ? `1px 1px 0px ${shadowColor}`
                          : `3px 3px 0px ${shadowColor}`,
                        cursor: 'pointer',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {diff.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </BrutalCard>

          {/* Item Count Section */}
          <BrutalCard
            headerTitle="4. QUANTITY"
            accentColor={theme.primary}
            style={{ marginBottom: 16 }}
          >
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Items per set:
            </Text>
            <View style={styles.presetsGrid}>
              {[5, 10, 15, 20].map((n) => {
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
                        transform: [{ translateX: pressed || isSelected ? 2 : 0 }, { translateY: pressed || isSelected ? 2 : 0 }],
                      },
                      Platform.OS === 'web' && {
                        boxShadow: isSelected
                          ? `1px 1px 0px ${shadowColor}`
                          : `3px 3px 0px ${shadowColor}`,
                        cursor: 'pointer',
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
                placeholder="e.g. 8, 12, 25"
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

          {/* Question Formats (if quiz or deck mode) */}
          {mode !== 'flashcards' && (
            <BrutalCard
              headerTitle="5. QUESTION TYPES"
              accentColor={theme.brandSecondary || '#F97316'}
              style={{ marginBottom: 20 }}
            >
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={[styles.toggleTitle, { color: theme.text }]}>Multiple Choice</Text>
                  <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                    4 options with detailed conceptual explanations
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
                    Rapid concept validation assertions
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
          )}

          {/* Action Button */}
          <BrutalButton
            title={loading ? 'SYNTHESIZING DECK WITH AI...' : 'GENERATE STUDY DECK'}
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
    padding: 20,
    borderRadius: 4,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#121212',
    letterSpacing: 1,
  },
  contextPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  contextPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
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
    padding: 14,
    borderRadius: 4,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },

  // Mode Selection
  modeGrid: {
    gap: 10,
  },
  modeCard: {
    padding: 14,
    borderRadius: 4,
  },
  modeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modeCardDesc: {
    fontSize: 12,
    fontWeight: '600',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    borderRadius: 4,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  customCountContainer: {
    marginTop: 6,
  },
  customCountInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    borderRadius: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 8,
  },
});
