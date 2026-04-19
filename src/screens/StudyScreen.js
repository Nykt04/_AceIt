import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Dimensions, Animated, Alert, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useStudy } from '../context/StudyContext';

const { width } = Dimensions.get('window');

function FlashcardView({ terms, questions }) {
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    ]).start();
  }, [scaleAnim, fadeAnim]);

  return (
    <Animated.View style={[styles.centered, { opacity: fadeAnim }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.scoreTitle}>Quiz complete</Text>
        <Text style={styles.scoreValue}>{score} / {total}</Text>
        <Text style={styles.scorePct}>{pct}%</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.8}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function QuizView({ terms, questions, onExit }) {
  const items = useMemo(() => {
    return (questions || []).map((q, i) => ({ ...q, id: q.id || `q-${i}` }));
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
    if (idx === correctIdx) setScore((s) => s + 1);
    
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
    <Animated.View style={[styles.quizWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.progress}>Question {current + 1} of {items.length}</Text>
      <Text style={styles.quizQuestion}>{item.question}</Text>
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
                activeOpacity={0.8}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      {answered && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>{current + 1 >= items.length - 1 ? 'See results' : 'Next'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function StudyScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { set, mode } = route.params || {};
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
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete set</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  back: { fontSize: 16, color: '#94a3b8' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#64748b' },
  backLink: { marginTop: 12, color: '#6366f1', fontSize: 15 },
  progress: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 12 },
  flashcardWrap: { flex: 1, padding: 20, justifyContent: 'center' },
  flashcardContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  flashcard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 28, minHeight: 200, justifyContent: 'center', width: '100%', backfaceVisibility: 'hidden' },
  flashcardFront: { position: 'absolute' },
  flashcardBack: { position: 'absolute' },
  flashcardTouch: { width: '100%', minHeight: 200, justifyContent: 'center' },
  cardSide: { fontSize: 18, color: '#f8fafc', textAlign: 'center', lineHeight: 26 },
  flashcardNav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingHorizontal: 20 },
  navBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  navBtnText: { fontSize: 16, color: '#6366f1', fontWeight: '600' },
  navBtnDisabled: { color: '#475569' },
  quizWrap: { flex: 1, padding: 20 },
  quizQuestion: { fontSize: 18, color: '#f8fafc', fontWeight: '600', marginBottom: 24, lineHeight: 26 },
  options: { marginBottom: 12 },
  optionBtn: { backgroundColor: '#1e293b', borderRadius: 14, padding: 18, marginBottom: 12 },
  optionCorrect: { backgroundColor: '#166534' },
  optionWrong: { backgroundColor: '#991b1b' },
  optionText: { fontSize: 16, color: '#f8fafc' },
  nextBtn: { marginTop: 24, backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  scoreTitle: { fontSize: 20, color: '#94a3b8', marginBottom: 8 },
  scoreValue: { fontSize: 36, fontWeight: '800', color: '#f8fafc' },
  scorePct: { fontSize: 24, color: '#6366f1', marginTop: 4 },
  doneBtn: { marginTop: 28, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: '#1e293b', borderRadius: 12 },
  doneBtnText: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  deleteBtn: { marginTop: 16, alignItems: 'center' },
  deleteText: { fontSize: 15, color: '#f87171' },
});
