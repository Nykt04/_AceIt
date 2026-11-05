import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

const { width } = Dimensions.get('window');

function FlashcardView({ terms, questions }) {
  const { theme } = useTheme();
  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  const cards = useMemo(() => {
    const fromTerms = (terms || []).map((t, i) => ({
      id: `t-${i}`,
      front: t.term,
      back: t.definition,
      type: 'term',
    }));
    const fromQuestions = (questions || []).map((q, i) => ({
      id: `q-${i}`,
      front: q.question,
      back:
        q.type === 'true_false'
          ? q.correctAnswer
            ? 'True'
            : 'False'
          : q.options?.[q.correctIndex] ?? '',
      type: 'question',
    }));
    return [...fromTerms, ...fromQuestions].filter((c) => c.front || c.back);
  }, [terms, questions]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flipAnim.setValue(0);
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      friction: 8,
      tension: 60,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [index, flipAnim, slideAnim]);

  const flipCard = () => {
    soundManager.playButtonClick();
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      friction: 8,
      tension: 35,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    setFlipped(!flipped);
  };

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 0, 1],
  });

  const frontScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 0.96, 0.96, 0.96],
  });

  const backScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0.96, 0.96, 0.96, 1],
  });

  if (cards.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: theme.text }]}>No flashcards to display</Text>
      </View>
    );
  }

  const card = cards[index];

  return (
    <View style={styles.flashcardWrap}>
      {/* Top Deck Progress Meter */}
      <View style={styles.deckProgressRow}>
        <BrutalBadge
          label={`CARD ${index + 1} OF ${cards.length}`}
          color={theme.accent || '#FFDE59'}
          textColor="#121212"
        />
        <BrutalBadge
          label={card.type === 'term' ? 'VOCAB TERM' : 'QUESTION'}
          color={theme.primary}
          textColor="#FFFFFF"
        />
      </View>

      {/* Physical Neubrutalist Flashcard */}
      <View style={styles.flashcardContainer}>
        {/* Front */}
        <Animated.View
          pointerEvents={flipped ? 'none' : 'auto'}
          style={[
            styles.flashcard,
            styles.flashcardFront,
            {
              backgroundColor: theme.card,
              borderColor: borderColor,
              borderWidth: borderWidth,
              opacity: frontOpacity,
              transform: [{ scale: frontScale }],
            },
            Platform.OS === 'web' && {
              boxShadow: `6px 6px 0px ${shadowColor}`,
            },
          ]}
        >
          <Pressable onPress={flipCard} style={styles.cardTouchArea}>
            <View
              style={[
                styles.cardHeaderStripe,
                {
                  backgroundColor: theme.primary,
                  borderBottomColor: borderColor,
                  borderBottomWidth: borderWidth,
                },
              ]}
            >
              <Text style={styles.cardHeaderStripeText}>FRONT • CLICK TO FLIP</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardText, { color: theme.text }]}>{card.front}</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Back */}
        <Animated.View
          pointerEvents={flipped ? 'auto' : 'none'}
          style={[
            styles.flashcard,
            styles.flashcardBack,
            {
              backgroundColor: theme.isDark ? '#1F1F1F' : '#FFFDF5',
              borderColor: borderColor,
              borderWidth: borderWidth,
              opacity: backOpacity,
              transform: [{ scale: backScale }],
            },
            Platform.OS === 'web' && {
              boxShadow: `6px 6px 0px ${shadowColor}`,
            },
          ]}
        >
          <Pressable onPress={flipCard} style={styles.cardTouchArea}>
            <View
              style={[
                styles.cardHeaderStripe,
                {
                  backgroundColor: theme.brandSecondary || '#FF5722',
                  borderBottomColor: borderColor,
                  borderBottomWidth: borderWidth,
                },
              ]}
            >
              <Text style={styles.cardHeaderStripeText}>BACK • DEFINITION</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardText, { color: theme.text }]}>{card.back}</Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Rating & Navigation Buttons */}
      <View style={styles.controlsSection}>
        <BrutalButton
          title={flipped ? 'FLIP TO FRONT' : 'REVEAL ANSWER (SPACE / TAP)'}
          variant={flipped ? 'outline' : 'secondary'}
          icon={<MaterialIcons name="flip" size={20} color={flipped ? theme.text : '#FFFFFF'} />}
          onPress={flipCard}
          style={{ marginBottom: 14 }}
        />

        <View style={styles.navRow}>
          <BrutalButton
            title="PREV"
            variant="outline"
            disabled={index === 0}
            icon={<MaterialIcons name="arrow-back" size={18} color={theme.text} />}
            onPress={() => {
              setIndex((i) => Math.max(0, i - 1));
              setFlipped(false);
            }}
            style={{ flex: 1 }}
          />
          <BrutalButton
            title="NEXT"
            variant="primary"
            disabled={index === cards.length - 1}
            icon={<MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />}
            onPress={() => {
              setIndex((i) => Math.min(cards.length - 1, i + 1));
              setFlipped(false);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  );
}

function QuizResults({ score, total, pct, onDone }) {
  const { theme } = useTheme();
  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  return (
    <View style={styles.centered}>
      <View
        style={[
          styles.resultsCard,
          {
            backgroundColor: theme.card,
            borderColor: borderColor,
            borderWidth: borderWidth,
          },
          Platform.OS === 'web' && {
            boxShadow: `6px 6px 0px ${shadowColor}`,
          },
        ]}
      >
        <View
          style={[
            styles.resultsStripe,
            {
              backgroundColor: pct >= 70 ? (theme.success || '#10B981') : (theme.brandSecondary || '#FF5722'),
              borderBottomColor: borderColor,
              borderBottomWidth: borderWidth,
            },
          ]}
        >
          <Text style={styles.resultsStripeText}>QUIZ COMPLETED</Text>
        </View>

        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={[styles.resultsScoreNumber, { color: theme.text }]}>
            {score}/{total}
          </Text>
          <BrutalBadge
            label={`${pct}% ACCURACY`}
            color={pct >= 70 ? '#10B981' : '#FF5722'}
            textColor="#FFFFFF"
            style={{ marginVertical: 12 }}
          />
          <Text style={[styles.resultsMessage, { color: theme.textSecondary }]}>
            {pct === 100
              ? 'PERFECT RUN! High mastery recorded.'
              : pct >= 75
              ? 'EXCELLENT SCORE! High retention.'
              : 'PRACTICE MAKES PERFECT. Review weak terms.'}
          </Text>

          <BrutalButton
            title="BACK TO DECK"
            variant="primary"
            icon={<MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />}
            onPress={onDone}
            style={{ width: '100%', marginTop: 16 }}
          />
        </View>
      </View>
    </View>
  );
}

function QuizView({ questions, onExit }) {
  const { theme } = useTheme();
  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  const items = useMemo(() => {
    return (questions || []).map((q, i) => ({
      ...q,
      id: q.id || `q-${i}`,
      options: q.type === 'true_false' ? ['True', 'False'] : q.options || [],
      correctIndex: q.type === 'true_false' ? (q.correctAnswer ? 0 : 1) : q.correctIndex ?? 0,
    }));
  }, [questions]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: theme.text }]}>No quiz questions available</Text>
      </View>
    );
  }

  const item = items[current];

  const onSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === item.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
    }
  };

  const next = () => {
    if (current + 1 >= items.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  if (finished) {
    const pct = Math.round((score / items.length) * 100);
    return <QuizResults score={score} total={items.length} pct={pct} onDone={onExit} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.quizScrollContent}>
      {/* Quiz Progress Header */}
      <View style={styles.deckProgressRow}>
        <BrutalBadge
          label={`QUESTION ${current + 1} OF ${items.length}`}
          color={theme.accent || '#FFDE59'}
          textColor="#121212"
        />
        <BrutalBadge
          label={`SCORE: ${score}`}
          color={theme.primary}
          textColor="#FFFFFF"
        />
      </View>

      {/* Question Card */}
      <BrutalCard
        accentColor={theme.brandSecondary || '#FF5722'}
        headerTitle={`QUESTION #${current + 1}`}
        style={{ marginTop: 12, marginBottom: 16 }}
      >
        <Text style={[styles.questionText, { color: theme.text }]}>{item.question}</Text>
      </BrutalCard>

      {/* Options */}
      <View style={styles.optionsWrap}>
        {item.options.map((opt, idx) => {
          const isCorrect = idx === item.correctIndex;
          const isSelected = selected === idx;
          const isWrong = isSelected && !isCorrect;

          let optionBg = theme.card;
          let optionBorder = borderColor;
          let labelText = opt;

          if (answered) {
            if (isCorrect) {
              optionBg = '#10B981';
              optionBorder = '#121212';
            } else if (isWrong) {
              optionBg = '#EF4444';
              optionBorder = '#121212';
            }
          }

          return (
            <Pressable
              key={idx}
              onPress={() => onSelect(idx)}
              disabled={answered}
              style={({ pressed }) => [
                styles.optionButton,
                {
                  backgroundColor: optionBg,
                  borderColor: optionBorder,
                  borderWidth: borderWidth,
                  transform: [
                    { translateX: pressed ? 2 : 0 },
                    { translateY: pressed ? 2 : 0 },
                  ],
                },
                Platform.OS === 'web' && {
                  boxShadow: `3px 3px 0px ${shadowColor}`,
                  cursor: answered ? 'default' : 'pointer',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                },
              ]}
            >
              <View
                style={[
                  styles.optionLetterBadge,
                  {
                    backgroundColor: answered && (isCorrect || isWrong) ? '#FFFFFF' : theme.background,
                    borderWidth: 2,
                    borderColor: borderColor,
                  },
                ]}
              >
                <Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  {
                    color: answered && (isCorrect || isWrong) ? '#FFFFFF' : theme.text,
                  },
                ]}
              >
                {labelText}
              </Text>
              {answered && isCorrect && (
                <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
              )}
              {answered && isWrong && (
                <MaterialIcons name="cancel" size={22} color="#FFFFFF" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Next Question Control */}
      {answered && (
        <BrutalButton
          title={current + 1 >= items.length ? 'FINISH & VIEW RESULTS' : 'NEXT QUESTION →'}
          variant="primary"
          onPress={next}
          style={{ marginTop: 20 }}
        />
      )}
    </ScrollView>
  );
}

export default function StudyScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { set, mode } = route.params || {};
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const terms = set?.terms || [];
  const questions = set?.questions || [];

  const borderColor = theme.border || '#121212';
  const borderWidth = theme.borderWidth || 3;

  if (!set) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Navbar onMenuPress={() => setSidebarOpen(true)} />
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.text }]}>No set selected</Text>
          <BrutalButton
            title="BACK TO HOME"
            variant="outline"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Sub Header */}
      <View
        style={[
          styles.subHeader,
          {
            borderBottomColor: borderColor,
            borderBottomWidth: borderWidth,
            backgroundColor: theme.background,
          },
        ]}
      >
        <BrutalButton
          title="EXIT"
          variant="outline"
          icon={<MaterialIcons name="close" size={18} color={theme.text} />}
          onPress={() => navigation.goBack()}
          style={{ minHeight: 38, paddingVertical: 6, paddingHorizontal: 12 }}
        />
        <Text style={[styles.subHeaderTitle, { color: theme.text }]}>
          {mode === 'flashcards' ? 'FLASHCARDS' : 'QUIZ MODE'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {mode === 'flashcards' ? (
        <FlashcardView terms={terms} questions={questions} />
      ) : (
        <QuizView questions={questions} onExit={() => navigation.goBack()} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Flashcards
  flashcardWrap: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  deckProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flashcardContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 280,
  },
  flashcard: {
    width: '100%',
    minHeight: 280,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'absolute',
  },
  flashcardFront: {
    zIndex: 2,
  },
  flashcardBack: {
    zIndex: 1,
  },
  cardTouchArea: {
    flex: 1,
    minHeight: 280,
  },
  cardHeaderStripe: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardHeaderStripeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  controlsSection: {
    paddingTop: 16,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Quiz
  quizScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  optionsWrap: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 4,
  },
  optionLetterBadge: {
    width: 32,
    height: 32,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#121212',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },

  // Results
  resultsCard: {
    width: Math.min(width * 0.9, 420),
    borderRadius: 4,
    overflow: 'hidden',
  },
  resultsStripe: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resultsStripeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  resultsScoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultsMessage: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
});
