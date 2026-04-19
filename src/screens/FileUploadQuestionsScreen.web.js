import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useStudy } from '../context/StudyContext';

export default function FileUploadQuestionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const existingSet = route.params?.existingSet;
  const { addStudySet, updateStudySet } = useStudy();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [loading, setLoading] = useState(false);
  const [setTitle, setSetTitle] = useState(existingSet?.title ?? '');

  const generateQuestionsFromText = (text, desiredCount) => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const questions = [];

    sentences
      .slice(0, Math.min(Math.ceil(desiredCount * 0.7), sentences.length))
      .forEach((sentence, idx) => {
        const cleaned = sentence.trim();
        if (cleaned.length > 0) {
          questions.push({
            question: `Which of the following relates to: "${cleaned.substring(0, 50)}..."?`,
            type: 'multiple_choice',
            options: [
              cleaned.substring(0, 40),
              'Alternative fact ' + (idx + 1),
              'Different concept ' + (idx + 1),
              'Unrelated statement',
            ],
            correctIndex: 0,
          });
        }
      });

    if (questions.length < desiredCount && sentences.length > 0) {
      const remainingCount = desiredCount - questions.length;
      sentences.slice(0, Math.min(remainingCount, 3)).forEach((sentence) => {
        questions.push({
          question: `True or False: The text mentions "${sentence.trim().substring(0, 30)}..."`,
          type: 'true_false',
          correctAnswer: true,
        });
      });
    }

    return questions;
  };

  const handleGenerate = async () => {
    if (!fileContent.trim()) {
      Alert.alert('Required', 'Please paste your study material first');
      return;
    }

    const questionCount = parseInt(numQuestions, 10);
    if (isNaN(questionCount) || questionCount < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of questions (minimum 1)');
      return;
    }

    if (questionCount > 100) {
      Alert.alert('Too Many', 'Maximum 100 questions allowed');
      return;
    }

    if (!setTitle.trim() && !existingSet) {
      Alert.alert('Required', 'Please enter a set title');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const mockQuestions = generateQuestionsFromText(fileContent, questionCount);
      const selectedQuestions = mockQuestions.slice(0, questionCount);

      if (selectedQuestions.length === 0) {
        Alert.alert('Info', 'No questions could be generated from the provided text. Try with more detailed content.');
        return;
      }

      if (existingSet) {
        const existing = existingSet.questions || [];
        await updateStudySet(existingSet.id, {
          questions: [...existing, ...selectedQuestions],
        });
        navigation.navigate('SetDetail', {
          set: { ...existingSet, questions: [...existing, ...selectedQuestions] },
        });
      } else {
        const newSet = await addStudySet({
          title: setTitle.trim(),
          description: 'Generated from pasted content (web)',
          terms: [],
          questions: selectedQuestions,
        });
        navigation.replace('SetDetail', { set: newSet });
      }

      Alert.alert('Success', `Generated ${selectedQuestions.length} questions!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate questions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Generate from File</Text>
          <Text style={styles.subtitle}>Web: paste text content (no file picker)</Text>
        </View>

        {!existingSet && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Set Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter set title"
              placeholderTextColor="#64748b"
              value={setTitle}
              onChangeText={setSetTitle}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Study Material</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Paste or type your notes here…"
            placeholderTextColor="#64748b"
            value={fileContent}
            onChangeText={setFileContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Number of Questions</Text>
          <View style={styles.questionInputContainer}>
            <TextInput
              style={styles.questionInput}
              placeholder="Enter desired number"
              placeholderTextColor="#64748b"
              value={numQuestions}
              onChangeText={setNumQuestions}
              keyboardType="number-pad"
            />
            <Text style={styles.questionInputHint}>Min: 1 | Max: 100</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.generateButtonText}>✨ Generate Questions</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
    color: '#f8fafc',
  },
  textArea: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
    color: '#f8fafc',
    minHeight: 180,
  },
  questionInputContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
  },
  questionInputHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
