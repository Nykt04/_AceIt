import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Dimensions, Animated, Alert, Platform, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

function FlashcardView({ terms, questions }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const cards = useMemo(() => {
    const fromTerms = (terms || []).map((t, i) => ({ id: `t-${i}`, front: t.term, back: t.definition, type: 'term' }));
    const fromQuestions = (questions || []).map((q, i) => ({
      id: `q-${i}`,
      front: q.question,
      back: q.type === 'true_false' ? (q.correctAnswer ? 'True' : 'False') : (q.options?.[q.correctIndex] ?? ''),
      type: 'question',
    }));
    return [...fromTerms, ...fromQuestions].filter((c) => c.front || c.back);
  }, [terms, questions]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset flip animation when card changes
    flipAnim.setValue(0);
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [index, flipAnim, slideAnim]);

  const flipCard = () => {
    if (flipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 1,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setFlipped(!flipped);
  };

  // Use fade and scale for better cross-platform compatibility
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
    outputRange: [1, 0.95, 0.95, 0.95],
  });

  const backScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0.95, 0.95, 0.95, 1],
  });

  if (cards.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No cards to show</Text>
      </View>
    );
  }

  const card = cards[index];
  const progress = `${index + 1} / ${cards.length}`;

  const slideX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <View style={styles.flashcardWrap}>
      <Text style={styles.progress}>{progress}</Text>
      <View style={styles.flashcardContainer}>
        <Animated.View
          style={[
            styles.flashcard,
            styles.flashcardFront,
            {
              opacity: frontOpacity,
              transform: [{ scale: frontScale }],
            },
          ]}
        >
          <TouchableOpacity onPress={flipCard} activeOpacity={1} style={styles.flashcardTouch}>
            <Text style={styles.cardSide}>{card.front}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[
            styles.flashcard,
            styles.flashcardBack,
            {
              opacity: backOpacity,
              transform: [{ scale: backScale }],
            },
          ]}
        >
          <TouchableOpacity onPress={flipCard} activeOpacity={1} style={styles.flashcardTouch}>
            <Text style={styles.cardSide}>{card.back}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <Animated.View style={{ transform: [{ translateX: slideX }], opacity: slideAnim }}>
        <View style={styles.flashcardNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }} disabled={index === 0}>
            <Text style={[styles.navBtnText, index === 0 && styles.navBtnDisabled]}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => { setIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={index === cards.length - 1}>
            <Text style={[styles.navBtnText, index === cards.length - 1 && styles.navBtnDisabled]}>Next →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

function QuizResults({ score, total, pct, onDone }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getResultMessage = () => {
    if (pct === 100) return '🎉 Perfect Score!';
    if (pct >= 80) return '🌟 Excellent!';
    if (pct >= 60) return '✨ Good Job!';
    if (pct >= 40) return '👍 Keep Going!';
    return '📚 Keep Practicing!';
  };

  const getPerformanceColor = () => {
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Animated.View style={[styles.centered, { opacity: fadeAnim }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {/* Trophy Icon with Glow */}
        <View style={styles.trophyContainer}>
          <View style={[styles.trophyGlow, { borderColor: getPerformanceColor() }]} />
          <Animated.View style={[styles.resultCard, { transform: [{ rotate: rotation }] }]}>
            <Text style={styles.resultIcon}>🏆</Text>
          </Animated.View>
        </View>
        
        {/* Main Title */}
        <Text style={styles.scoreTitle}>Quiz Complete!</Text>
        <Text style={[styles.resultMessage, { color: getPerformanceColor() }]}>{getResultMessage()}</Text>
        
        {/* Score Display Cards */}
        <View style={styles.scoreBox}>
          <View style={[styles.scoreItem, styles.scoreItemPrimary]}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreOutOf}>out of {total}</Text>
          </View>
          <View style={[styles.scoreItem, { borderColor: getPerformanceColor() }]}>
            <Text style={styles.scoreLabel}>Accuracy</Text>
            <Text style={[styles.scorePct, { color: getPerformanceColor() }]}>{pct}%</Text>
          </View>
        </View>

        {/* Enhanced Progress Bar */}
        <View style={styles.scoreBarContainer}>
          <View style={[styles.scoreBarBackground]} />
          <Animated.View style={[
            styles.scoreBar, 
            { 
              width: `${pct}%`, 
              backgroundColor: getPerformanceColor(),
            }
          ]} />
        </View>

        {/* Performance Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Correct</Text>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{score}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Wrong</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{total - score}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, { color: theme.primaryAccent }]}>{total}</Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: getPerformanceColor() }]} onPress={onDone} activeOpacity={0.8}>
          <Text style={styles.doneBtnIcon}>←</Text>
          <Text style={styles.doneBtnText}>Back to Set</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function QuizView({ terms, questions, onExit }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Shuffle function (Fisher-Yates algorithm)
  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const items = useMemo(() => {
    // Shuffle questions and add IDs
    const shuffledQuestions = shuffleArray(questions || []);
    return shuffledQuestions.map((q, i) => {
      // For multiple choice questions, also shuffle the options
      if (q.type !== 'true_false' && q.options && q.options.length > 1) {
        const optionsWithIdx = q.options.map((opt, idx) => ({ opt, originalIdx: idx }));
        
        // Fisher-Yates shuffle
        for (let i = optionsWithIdx.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [optionsWithIdx[i], optionsWithIdx[j]] = [optionsWithIdx[j], optionsWithIdx[i]];
        }
        
        // Find where the correct answer ended up
        const newCorrectIdx = optionsWithIdx.findIndex(item => item.originalIdx === q.correctIndex);
        
        return {
          ...q,
          options: optionsWithIdx.map(item => item.opt),
          correctIndex: newCorrectIdx,
          id: q.id || `q-${i}`,
        };
      }
      
      return { ...q, id: q.id || `q-${i}` };
    });
  }, [questions]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const optionAnims = useRef({}).current;

  // Get or create animation value for an option index
  const getOptionAnim = (idx) => {
    if (!optionAnims[idx]) {
      optionAnims[idx] = new Animated.Value(1);
    }
    return optionAnims[idx];
  };

  useEffect(() => {
    // Animate question transition
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [current, fadeAnim, slideAnim]);

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No quiz questions</Text>
      </View>
    );
  }

  const item = items[current];
  const isTF = item.type === 'true_false';
  const options = isTF ? ['True', 'False'] : (item.options || []);
  const correctIdx = isTF ? (item.correctAnswer ? 0 : 1) : (item.correctIndex ?? 0);

  const onSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === correctIdx;
    if (isCorrect) {
      setScore((s) => s + 1);
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
    }
    
    // Animate option selection
    const animValue = getOptionAnim(idx);
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
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
    return (
      <QuizResults score={score} total={items.length} pct={pct} onDone={onExit} />
    );
  }

  return (
    <View style={[styles.quizWrap]}>
      <Animated.ScrollView 
        style={[{ opacity: fadeAnim }]}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.quizScrollContent}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View style={styles.progressBarBg} />
            <View style={[styles.progressFill, { width: `${((current + 1) / items.length) * 100}%` }]} />
          </View>
          <Text style={styles.progress}>Question {current + 1} of {items.length}</Text>
          
          {/* Question Container */}
          <View style={styles.questionContainer}>
            <View style={styles.questionNumberBadge}>
              <Text style={styles.questionNumberText}>{current + 1}</Text>
            </View>
            <Text style={styles.quizQuestion}>{item.question}</Text>
          </View>
          
          {/* Options */}
          <View style={styles.options}>
            {options.map((opt, idx) => {
              const isCorrect = idx === correctIdx;
              const isWrong = selected === idx && !isCorrect;
              const showResult = answered && (isCorrect || isWrong);
              const animValue = getOptionAnim(idx);
              return (
                <Animated.View key={idx} style={{ transform: [{ scale: animValue }] }}>
                  <TouchableOpacity
                    style={[
                      styles.optionBtn,
                      showResult && isCorrect && styles.optionCorrect,
                      showResult && isWrong && styles.optionWrong,
                    ]}
                    onPress={() => onSelect(idx)}
                    disabled={answered}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View style={[styles.optionIndex, showResult && isCorrect && styles.optionIndexCorrect, showResult && isWrong && styles.optionIndexWrong]}>
                        <Text style={styles.optionIndexText}>{String.fromCharCode(65 + idx)}</Text>
                      </View>
                      <Text style={styles.optionText}>{opt}</Text>
                    </View>
                    {showResult && isCorrect && <Text style={styles.correctIcon}>✓</Text>}
                    {showResult && isWrong && <Text style={styles.wrongIcon}>✕</Text>}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Explanation Box */}
          {answered && item.explanation && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.explanationBox}>
                <Text style={styles.explanationText}>{item.explanation}</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.ScrollView>
      {answered && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>{current + 1 >= items.length - 1 ? 'See results' : 'Next'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

export default function StudyScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { set, mode } = route.params || {};
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const terms = set?.terms || [];
  const questions = set?.questions || [];
  const { deleteStudySet, refresh } = useStudy();

  const handleDelete = async () => {
    const proceed = Platform.OS === 'web'
      ? window.confirm(`Are you sure you want to delete "${set?.title || 'this set'}"? This action cannot be undone.`)
      : await new Promise((res) => {
          Alert.alert(
            'Delete set',
            `Are you sure you want to delete "${set?.title || 'this set'}"? This action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => res(false) },
              { text: 'Delete', style: 'destructive', onPress: () => res(true) },
            ]
          );
        });
    if (!proceed) return;
    const ok = await deleteStudySet(set.id);
    if (!ok) {
      Alert.alert('Error', 'Failed to delete the set.');
      return;
    }
    navigation.goBack();
  };

  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar onMenuPress={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No set selected</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backLink}>Go back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mode === 'flashcards' ? 'Flashcards' : 'Quiz'}</Text>
        <View style={{ width: 50 }} />
      </View>
      {mode === 'flashcards' ? (
        <FlashcardView terms={terms} questions={questions} />
      ) : (
        <QuizView terms={terms} questions={questions} onExit={() => navigation.goBack()} />
      )}
      {mode === 'flashcards' && (
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete set</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 16, 
      paddingVertical: 14,
      borderBottomWidth: 1.5, 
      borderBottomColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    back: { 
      fontSize: 17, 
      color: theme.textSecondary,
      fontWeight: '700',
    },
    headerTitle: { 
      fontSize: 19, 
      fontWeight: '800', 
      color: theme.text 
    },
    centered: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    emptyText: { 
      fontSize: 17, 
      color: theme.textTertiary,
      fontWeight: '600',
    },
    backLink: { 
      marginTop: 14, 
      color: theme.primaryAccent, 
      fontSize: 16,
      fontWeight: '700',
    },
    progress: { 
      fontSize: 15, 
      color: theme.textSecondary, 
      textAlign: 'center', 
      marginBottom: 14,
      fontWeight: '600',
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      marginBottom: 16,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primaryAccent,
      borderRadius: 3,
    },
    questionContainer: {
      backgroundColor: theme.secondary,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1.5,
      borderColor: theme.border,
      shadowColor: theme.primaryAccent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    flashcardWrap: { 
      flex: 1, 
      padding: 20, 
      justifyContent: 'space-between',
      flexDirection: 'column',
    },
    flashcardContainer: { 
      position: 'relative', 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1,
      minHeight: 300,
    },
    flashcard: { 
      backgroundColor: theme.secondary, 
      borderRadius: 24, 
      padding: 32, 
      minHeight: 280, 
      justifyContent: 'center', 
      width: '100%', 
      backfaceVisibility: 'hidden',
      borderWidth: 2,
      borderColor: theme.primaryAccent,
      shadowColor: theme.primaryAccent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    flashcardFront: { 
      position: 'absolute' 
    },
    flashcardBack: { 
      position: 'absolute' 
    },
    flashcardTouch: { 
      width: '100%', 
      minHeight: 240, 
      justifyContent: 'center' 
    },
    cardSide: { 
      fontSize: 22, 
      color: theme.text, 
      textAlign: 'center', 
      lineHeight: 32,
      fontWeight: '700',
    },
    flashcardNav: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginTop: 28, 
      paddingHorizontal: 0,
      gap: 12,
    },
    navBtn: { 
      flex: 1,
      paddingVertical: 16, 
      paddingHorizontal: 20,
      backgroundColor: theme.secondary,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.primaryAccent,
      shadowColor: theme.primaryAccent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    navBtnText: { 
      fontSize: 16, 
      color: theme.primaryAccent, 
      fontWeight: '700',
      textAlign: 'center',
    },
    navBtnDisabled: { 
      color: theme.textTertiary,
      borderColor: theme.border,
    },
    quizWrap: { 
      flex: 1, 
      padding: 20,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    quizScrollContent: {
      paddingBottom: 20,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    progressBarBg: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: theme.border,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primaryAccent,
      borderRadius: 4,
    },
    progress: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
      marginBottom: 20,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    questionContainer: {
      backgroundColor: theme.secondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1.5,
      borderColor: theme.primaryAccent + '30',
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    questionNumberBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primaryAccent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    questionNumberText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#fff',
    },
    quizQuestion: { 
      fontSize: 18, 
      color: theme.text, 
      fontWeight: '700', 
      marginBottom: 0, 
      lineHeight: 28,
    },
    options: { 
      marginBottom: 16,
    },
    optionBtn: { 
      backgroundColor: theme.secondary, 
      borderRadius: 14, 
      padding: 16, 
      marginBottom: 12,
      borderWidth: 2,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    optionIndex: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
      backgroundColor: theme.primaryAccent,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      minWidth: 32,
      textAlign: 'center',
    },
    optionIndexText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
    optionIndexCorrect: {
      backgroundColor: '#22c55e',
    },
    optionIndexWrong: {
      backgroundColor: '#f87171',
    },
    optionCorrect: { 
      backgroundColor: '#166534',
      borderColor: '#22c55e',
      borderWidth: 2,
    },
    optionWrong: { 
      backgroundColor: '#991b1b',
      borderColor: '#f87171',
      borderWidth: 2,
    },
    correctIcon: {
      fontSize: 24,
      color: '#22c55e',
      fontWeight: '700',
    },
    wrongIcon: {
      fontSize: 24,
      color: '#f87171',
      fontWeight: '700',
    },
    optionText: { 
      fontSize: 15, 
      color: theme.text,
      fontWeight: '600',
      flex: 1,
      lineHeight: 20,
    },
    explanationBox: {
      backgroundColor: theme.primaryAccent + '10',
      borderLeftWidth: 4,
      borderLeftColor: theme.primaryAccent,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      marginTop: 20,
      borderWidth: 1.5,
      borderColor: theme.primaryAccent + '30',
      maxHeight: 240,
      shadowColor: theme.primaryAccent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    explanationIcon: {
      fontSize: 20,
      marginBottom: 8,
    },
    explanationTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primaryAccent,
      marginBottom: 10,
    },
    explanationText: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 21,
      fontWeight: '500',
    },
    nextBtn: { 
      marginHorizontal: 0,
      marginBottom: 20,
      backgroundColor: theme.primaryAccent, 
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 14, 
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: theme.primaryAccent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    nextBtnText: { 
      fontSize: 16, 
      fontWeight: '700', 
      color: '#fff' 
    },
    scoreTitle: { 
      fontSize: 28, 
      color: theme.text, 
      marginBottom: 12,
      marginTop: 24,
      fontWeight: '800',
      textAlign: 'center',
    },
    resultMessage: {
      fontSize: 20,
      color: theme.primaryAccent,
      marginBottom: 32,
      fontWeight: '700',
      textAlign: 'center',
    },
    trophyContainer: {
      position: 'relative',
      alignItems: 'center',
      marginBottom: 12,
      width: 140,
      height: 140,
      alignSelf: 'center',
    },
    trophyGlow: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 3,
      borderColor: theme.primaryAccent,
      opacity: 0.3,
    },
    resultCard: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.primaryAccent,
      shadowColor: theme.primaryAccent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    resultIcon: {
      fontSize: 72,
    },
    scoreBox: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 28,
    },
    scoreItemPrimary: {
      backgroundColor: theme.primaryAccent + '15',
      borderColor: theme.primaryAccent,
    },
    scoreItem: {
      flex: 1,
      backgroundColor: theme.secondary,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.border,
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    scoreLabel: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    scoreValue: { 
      fontSize: 40, 
      fontWeight: '900', 
      color: theme.text,
      lineHeight: 44,
    },
    scoreOutOf: {
      fontSize: 12,
      color: theme.textTertiary,
      fontWeight: '600',
      marginTop: 4,
    },
    scorePct: { 
      fontSize: 40, 
      color: theme.primaryAccent, 
      fontWeight: '900',
      lineHeight: 44,
    },
    scoreBarContainer: {
      height: 12,
      backgroundColor: theme.border,
      borderRadius: 6,
      marginBottom: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    scoreBarBackground: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: theme.border,
    },
    scoreBar: {
      height: '100%',
      borderRadius: 6,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.secondary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1.5,
      borderColor: theme.border,
      justifyContent: 'space-around',
      alignItems: 'center',
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
    },
    divider: {
      width: 1,
      height: 30,
      backgroundColor: theme.border,
    },
    doneBtn: { 
      backgroundColor: theme.primaryAccent, 
      paddingVertical: 16, 
      paddingHorizontal: 32,
      borderRadius: 14, 
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      shadowColor: theme.primaryAccent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    doneBtnIcon: {
      fontSize: 20,
      color: '#fff',
      fontWeight: '700',
    },
    doneBtnText: { 
      fontSize: 18, 
      fontWeight: '700', 
      color: '#fff' 
    },
    deleteBtn: { 
      marginVertical: 20, 
      alignItems: 'center',
      paddingVertical: 12,
    },
    deleteText: { 
      fontSize: 16, 
      color: theme.error,
      fontWeight: '700',
    },
  });
}
