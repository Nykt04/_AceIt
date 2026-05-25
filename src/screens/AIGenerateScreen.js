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
  const [customCount, setCustomCount] = useState('');
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

    // Use custom count if provided, otherwise use preset count
    const finalCount = customCount.trim() ? parseInt(customCount, 10) : count;
    
    if (isNaN(finalCount) || finalCount < 1) {
      setError('Please enter a valid number of questions (1 or more)');
      return;
    }
    if (finalCount > 500) {
      setError('Maximum 500 questions allowed');
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
      const questions = await generateQuestions(t, finalCount, { multipleChoice, trueFalse });
      
      // Convert questions to flashcard terms
      const terms = questions.map((q) => ({
        term: q.question || 'Question',
        definition: q.explanation || q.correctAnswer?.toString() || 'Answer',
      }));

      if (existingSet) {
        const existing = existingSet.questions || [];
        const existingTerms = existingSet.terms || [];
        await updateStudySet(existingSet.id, { 
          questions: [...existing, ...questions],
          terms: [...existingTerms, ...terms],
        });
        navigation.navigate('SetDetail', { set: { ...existingSet, questions: [...existing, ...questions], terms: [...existingTerms, ...terms] } });
      } else {
        const newSet = await addStudySet({ title: t, description: 'Generated with AI', terms, questions });
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
        {/* Topic Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Topic or Subject</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. World War 2, Python basics, Spanish verbs"
            placeholderTextColor={theme.textTertiary}
            value={topic}
            onChangeText={setTopic}
            editable={!existingSet}
          />
        </View>

        {/* Number of Questions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Number of Questions</Text>
          </View>
          
          {/* Quick Select Buttons */}
          <View style={styles.quickSelectContainer}>
            <Text style={styles.quickSelectLabel}>Quick select:</Text>
            <View style={styles.countRow}>
              {[3, 5, 8, 10].map((n) => (
                <AnimatedCountButton
                  key={n}
                  value={n}
                  selected={count === n && !customCount.trim()}
                  onPress={() => {
                    setCount(n);
                    setCustomCount('');
                  }}
                  styles={styles}
                />
              ))}
            </View>
          </View>

          {/* Custom Input Section */}
          <View style={styles.customSelectContainer}>
            <Text style={styles.customLabel}>Or enter a custom number:</Text>
            <View style={styles.customInputWrapper}>
              <TextInput
                style={styles.customInput}
                placeholder="15, 20, 25, 50..."
                placeholderTextColor={theme.textTertiary}
                value={customCount}
                onChangeText={(text) => {
                  setCustomCount(text);
                  if (text.trim()) {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num > 0) {
                      setCount(num);
                    }
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* Question Types Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Question Types</Text>
          </View>
          
          <View style={styles.typeCard}>
            <View style={styles.typeHeader}>
              <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>Multiple Choice</Text>
                <Text style={styles.typeDesc}>Select from 4 options</Text>
              </View>
            </View>
            <Switch 
              value={multipleChoice} 
              onValueChange={setMultipleChoice} 
              trackColor={{ false: theme.border, true: theme.primaryAccent + '40' }} 
              thumbColor={multipleChoice ? theme.primaryAccent : theme.border}
            />
          </View>

          <View style={styles.typeCard}>
            <View style={styles.typeHeader}>
              <View style={styles.typeInfo}>
                <Text style={styles.typeTitle}>True or False</Text>
                <Text style={styles.typeDesc}>Quick yes/no questions</Text>
              </View>
            </View>
            <Switch 
              value={trueFalse} 
              onValueChange={setTrueFalse} 
              trackColor={{ false: theme.border, true: theme.primaryAccent + '40' }} 
              thumbColor={trueFalse ? theme.primaryAccent : theme.border}
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {/* Generate Button */}
        <Animated.View style={{ transform: [{ scale: generateBtnScale }] }}>
          <TouchableOpacity 
            style={[styles.generateBtn, loading && styles.generateBtnDisabled]} 
            onPress={generate} 
            disabled={loading} 
            activeOpacity={0.9}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#f5f5f5" />
                <Text style={styles.generateText}>Generating...</Text>
              </>
            ) : (
              <>
                <Text style={styles.generateText}>Generate Questions</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Tips</Text>
          <Text style={styles.infoText}>• Be specific with your topic for better results</Text>
          <Text style={styles.infoText}>• Combine question types for diverse learning</Text>
          <Text style={styles.infoText}>• AI generates both questions and flashcard terms</Text>
        </View>
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
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  // Section Styling
  section: {
    marginBottom: 28,
    backgroundColor: theme.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },
  
  // Input Styling
  input: { 
    backgroundColor: theme.background, 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    color: theme.text, 
    borderWidth: 1.5, 
    borderColor: theme.border,
    fontWeight: '500',
  },
  
  // Quick Select Buttons
  quickSelectContainer: {
    marginBottom: 20,
  },
  quickSelectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countRow: { 
    flexDirection: 'row', 
    gap: 10,
    justifyContent: 'space-between',
  },
  countBtn: { 
    flex: 1, 
    backgroundColor: theme.background, 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: theme.border,
    justifyContent: 'center',
  },
  countBtnActive: { 
    backgroundColor: theme.primaryAccent, 
    borderColor: theme.primaryAccent,
  },
  countText: { 
    fontSize: 16, 
    color: theme.textSecondary, 
    fontWeight: '700' 
  },
  countTextActive: { 
    color: '#f5f5f5' 
  },
  
  // Custom Input Section
  customSelectContainer: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.primaryAccent + '30',
    borderStyle: 'dashed',
  },
  customLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.textSecondary, 
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: theme.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputPrefix: {
    fontSize: 18,
    paddingLeft: 12,
  },
  customInput: { 
    flex: 1,
    padding: 12, 
    fontSize: 16, 
    color: theme.text, 
    fontWeight: '500',
  },
  customHint: {
    fontSize: 12,
    color: theme.textTertiary,
    fontWeight: '500',
    marginTop: 8,
  },
  
  // Question Type Cards
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: 12,
    color: theme.textTertiary,
    fontWeight: '500',
  },
  
  // Error Message
  errorBox: {
    backgroundColor: theme.error + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.error + '30',
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  error: { 
    color: theme.error, 
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  
  // Generate Button
  generateBtn: { 
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: theme.primaryAccent, 
    paddingVertical: 18, 
    borderRadius: 14, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: theme.primaryAccent, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    elevation: 8,
  },
  generateBtnDisabled: { 
    opacity: 0.7 
  },
  generateIcon: {
    fontSize: 20,
  },
  generateText: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#f5f5f5' 
  },
  
  // Info Box
  infoBox: {
    backgroundColor: theme.primaryAccent + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.primaryAccent + '30',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
    lineHeight: 18,
  },
  
  // Loading Overlay
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
