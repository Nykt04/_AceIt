import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Switch, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { generateQuestions } from '../services/aiService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AnimatedCountButton = ({ value, selected, onPress, styles }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.countBtn, selected && styles.countBtnActive]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[styles.countText, selected && styles.countTextActive]}>{value}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AIGenerateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const existingSet = route.params?.existingSet;
  const { addStudySet, updateStudySet } = useStudy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [topic, setTopic] = useState(existingSet?.title ?? '');
  const [count, setCount] = useState(5);
  const [multipleChoice, setMultipleChoice] = useState(true);
  const [trueFalse, setTrueFalse] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generateBtnScale = useRef(new Animated.Value(1)).current;

  const generate = async () => {
    const t = topic.trim();
    if (!t) {
      setError('Enter a topic');
      return;
    }
    if (!multipleChoice && !trueFalse) {
      setError('Select at least one question type');
      return;
    }
    setError('');
    setLoading(true);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(generateBtnScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(generateBtnScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    try {
      const questions = await generateQuestions(t, count, { multipleChoice, trueFalse });
      if (existingSet) {
        const existing = existingSet.questions || [];
        await updateStudySet(existingSet.id, { questions: [...existing, ...questions] });
        navigation.navigate('SetDetail', { set: { ...existingSet, questions: [...existing, ...questions] } });
      } else {
        const newSet = await addStudySet({ title: t, description: 'Generated with AI', terms: [], questions });
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (e) {
      setError(e.message || 'Generation failed');
      Alert.alert('Error', e.message || 'Could not generate questions. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Generate</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Topic or subject</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. World War 2, Python basics, Spanish verbs"
          placeholderTextColor={theme.textTertiary}
          value={topic}
          onChangeText={setTopic}
          editable={!existingSet}
        />
        <Text style={styles.label}>Number of questions</Text>
        <View style={styles.countRow}>
          {[3, 5, 8, 10].map((n) => (
            <AnimatedCountButton
              key={n}
              value={n}
              selected={count === n}
              onPress={() => setCount(n)}
              styles={styles}
            />
          ))}
        </View>
        <Text style={styles.label}>Question types</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Multiple choice</Text>
          <Switch value={multipleChoice} onValueChange={setMultipleChoice} trackColor={{ false: theme.border, true: theme.primaryAccent }} thumbColor="#f5f5f5" />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>True or False</Text>
          <Switch value={trueFalse} onValueChange={setTrueFalse} trackColor={{ false: theme.border, true: theme.primaryAccent }} thumbColor="#f5f5f5" />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Animated.View style={{ transform: [{ scale: generateBtnScale }] }}>
          <TouchableOpacity style={[styles.generateBtn, loading && styles.generateBtnDisabled]} onPress={generate} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color="#f5f5f5" /> : <Text style={styles.generateText}>Generate questions</Text>}
          </TouchableOpacity>
        </Animated.View>
      
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.primaryAccent} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Generating Quiz Questions
            </Text>
            <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
              Please wait while the AI creates your questions...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  cancel: { fontSize: 16, color: theme.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: '600', color: theme.text },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.secondary, borderRadius: 12, padding: 16, fontSize: 16, color: theme.text, borderWidth: 1, borderColor: theme.border },
  countRow: { flexDirection: 'row', marginTop: 8 },
  countBtn: { flex: 1, backgroundColor: theme.secondary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: theme.border },
  countBtnActive: { backgroundColor: theme.primaryAccent, borderColor: theme.primaryAccent },
  countText: { fontSize: 16, color: theme.textSecondary, fontWeight: '600' },
  countTextActive: { color: '#f5f5f5' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  switchLabel: { fontSize: 16, color: theme.text },
  error: { color: theme.error, marginTop: 12, fontSize: 14 },
  generateBtn: { marginTop: 28, backgroundColor: theme.primaryAccent, paddingVertical: 18, borderRadius: 14, alignItems: 'center', shadowColor: theme.primaryAccent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  generateBtnDisabled: { opacity: 0.7 },
  generateText: { fontSize: 17, fontWeight: '700', color: '#f5f5f5' },
  hint: { marginTop: 16, fontSize: 12, color: theme.textTertiary, textAlign: 'center' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContent: {
    backgroundColor: theme.secondary,
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
