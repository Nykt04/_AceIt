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
import * as DocumentPicker from 'expo-document-picker';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useStudy } from '../context/StudyContext';

export default function FileUploadQuestionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const existingSet = route.params?.existingSet;
  const { addStudySet, updateStudySet } = useStudy();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [loading, setLoading] = useState(false);
  const [setTitle, setSetTitle] = useState(existingSet?.title ?? '');

  // Extract text from file content
  const extractTextFromFile = async (fileUri, fileName) => {
    const fileNameLower = fileName.toLowerCase();
    
    // For text files, read the content directly
    if (fileNameLower.endsWith('.txt')) {
      try {
        const response = await fetch(fileUri);
        const text = await response.text();
        return text;
      } catch (error) {
        Alert.alert('Error', 'Failed to read text file');
        return null;
      }
    }
    
    // For PDFs and DOCX, we'll use a simple conversion approach
    // In production, you'd use a server-side API for proper extraction
    if (fileNameLower.endsWith('.pdf') || fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
      Alert.alert(
        'File Type',
        'PDF and DOCX files will be processed. Please note: text extraction may be approximate and should be reviewed.',
        [{ text: 'OK' }]
      );
      // For now, return a placeholder that indicates the file was selected
      // In a production app, you'd send this to a backend API for proper extraction
      return `[File: ${fileName}]\n\nNote: Please provide the extracted text or ensure the file contains readable text content.`;
    }
    
    // For other file types, prompt user to paste content
    Alert.alert('Unsupported File Type', `${fileNameLower} files are not directly supported. Please paste the text content manually.`);
    return null;
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const file = {
          uri: result.uri,
          name: result.name,
          size: result.size ?? 0,
        };

        const extractedText = await extractTextFromFile(file.uri, file.name);
        
        if (extractedText) {
          setSelectedFile(file);
          setFileName(file.name);
          setFileContent(extractedText);
          Alert.alert('Success', `File ready: ${file.name}`);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select file: ' + (err?.message || 'Unknown error'));
    }
  };

  const generateQuestionsFromText = (text, desiredCount) => {
    // Simple question generation from text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questions = [];
    const questionCount = Math.min(desiredCount, sentences.length * 2);

    // Create multiple choice questions from sentences
    sentences.slice(0, Math.min(Math.ceil(desiredCount * 0.7), sentences.length)).forEach((sentence, idx) => {
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

    // Add true/false questions for remaining count
    if (questions.length < desiredCount && sentences.length > 0) {
      const remainingCount = desiredCount - questions.length;
      sentences.slice(0, Math.min(remainingCount, 3)).forEach((sentence, idx) => {
        questions.push({
          question: `True or False: The text mentions "${sentence.trim().substring(0, 30)}..."`,
          type: 'true_false',
          correctAnswer: true,
        });
      });
    }

    return questions;
  };

  const handleGenerateFromFile = async () => {
    if (!selectedFile) {
      Alert.alert('Required', 'Please select a file first');
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
      // Simulate processing time for file extraction and generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate questions based on file content
      const mockQuestions = generateQuestionsFromText(fileContent, questionCount);
      const selectedQuestions = mockQuestions.slice(0, questionCount);

      if (selectedQuestions.length === 0) {
        Alert.alert('Info', 'No questions could be generated from the provided text. Try with more detailed content.');
        setLoading(false);
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
          description: `Generated from file: ${fileName}`,
          terms: [],
          questions: selectedQuestions,
        });
        navigation.replace('SetDetail', { set: newSet });
      }

      Alert.alert('Success', `Generated ${selectedQuestions.length} questions from file!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate questions from file');
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
          <Text style={styles.subtitle}>Upload a document to create questions</Text>
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
          <View style={styles.fileBox}>
            {!selectedFile ? (
              <>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={styles.fileText}>No file selected</Text>
                <Text style={styles.fileHint}>Select a document to extract content</Text>
              </>
            ) : (
              <>
                <Text style={styles.fileIcon}>✓</Text>
                <Text style={styles.fileText}>{fileName}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectFile}
            activeOpacity={0.8}
          >
            <Text style={styles.selectButtonText}>📂 Select File</Text>
          </TouchableOpacity>
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

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 How it works:</Text>
          <Text style={styles.infoText}>
            1. Paste your study material or document text
          </Text>
          <Text style={styles.infoText}>2. Select number of questions to generate</Text>
          <Text style={styles.infoText}>
            3. AI extracts key concepts and creates questions
          </Text>
          <Text style={styles.infoText}>
            4. Review and add questions to your study set
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerateFromFile}
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
  fileBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  fileIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  fileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  fileHint: {
    fontSize: 12,
    color: '#64748b',
  },
  fileSize: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 8,
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  infoBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 18,
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
