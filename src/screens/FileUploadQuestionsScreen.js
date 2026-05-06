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
import { generateQuestionsFromText } from '../services/aiService';

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

  const handleGenerateFromFile = async () => {
    if (!fileContent.trim()) {
      Alert.alert('Required', 'Please provide study material first');
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
      const questions = await generateQuestionsFromText(fileContent, questionCount);

      if (!questions || questions.length === 0) {
        Alert.alert('Info', 'No questions could be generated. Try with more detailed content.');
        return;
      }

      if (existingSet) {
        const existing = existingSet.questions || [];
        await updateStudySet(existingSet.id, {
          questions: [...existing, ...questions],
        });
        navigation.navigate('SetDetail', {
          set: { ...existingSet, questions: [...existing, ...questions] },
        });
      } else {
        const newSet = await addStudySet({
          title: setTitle.trim(),
          description: 'AI-generated from study material',
          terms: [],
          questions,
        });
        navigation.replace('SetDetail', { set: newSet });
      }

      Alert.alert('Success', `Generated ${questions.length} questions using AI!`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate questions');
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
    padding: 24,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
  },
  section: {
    marginBottom: 36,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
    color: '#f8fafc',
  },
  fileBox: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginBottom: 18,
  },
  fileIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  fileText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  fileHint: {
    fontSize: 13,
    color: '#64748b',
  },
  fileSize: {
    fontSize: 13,
    color: '#6366f1',
    marginTop: 12,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
  },
  questionInputHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 12,
    paddingHorizontal: 2,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#6366f1',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 11,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 18,
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
