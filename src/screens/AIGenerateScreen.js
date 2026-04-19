import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Switch, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import { generateQuestions } from '../services/aiService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AnimatedCountButton = ({ value, selected, onPress }) => {
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
          placeholderTextColor="#64748b"
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
            />
          ))}
        </View>
        <Text style={styles.label}>Question types</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Multiple choice</Text>
          <Switch value={multipleChoice} onValueChange={setMultipleChoice} trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>True or False</Text>
          <Switch value={trueFalse} onValueChange={setTrueFalse} trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Animated.View style={{ transform: [{ scale: generateBtnScale }] }}>
          <TouchableOpacity style={[styles.generateBtn, loading && styles.generateBtnDisabled]} onPress={generate} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateText}>✨ Generate questions</Text>}
          </TouchableOpacity>
        </Animated.View>
      
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  cancel: { fontSize: 16, color: '#94a3b8' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, fontSize: 16, color: '#f8fafc' },
  countRow: { flexDirection: 'row', marginTop: 8 },
  countBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginRight: 10 },
  countBtnActive: { backgroundColor: '#6366f1' },
  countText: { fontSize: 16, color: '#94a3b8', fontWeight: '600' },
  countTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  switchLabel: { fontSize: 16, color: '#e2e8f0' },
  error: { color: '#f87171', marginTop: 12, fontSize: 14 },
  generateBtn: { marginTop: 28, backgroundColor: '#6366f1', paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  generateBtnDisabled: { opacity: 0.7 },
  generateText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  hint: { marginTop: 16, fontSize: 12, color: '#64748b', textAlign: 'center' },
});
