import React, { useState, useRef } from 'react';
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
import { generateQuestionsFromText } from '../services/aiService';
import { extractTextFromFile, getFileValidationError } from '../services/fileService';
import { handleError, showSuccess, logError } from '../services/notificationService';

export default function FileUploadQuestionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const existingSet = route.params?.existingSet;
  const { addStudySet, updateStudySet } = useStudy();
  const fileInputRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [loading, setLoading] = useState(false);
  const [setTitle, setSetTitle] = useState(existingSet?.title ?? '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'file'

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = getFileValidationError(file);
    if (error) {
      handleError(new Error(error), 'FileUpload');
      return;
    }

    setSelectedFile(file);
    setExtracting(true);

    try {
      console.log(`[FileUploadScreen] Starting extraction for file: ${file.name}`);
      const extractedText = await extractTextFromFile(file);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('The file appears to be empty. Please check the file and try again.');
      }

      setFileContent(extractedText);
      setInputMode('file');
      showSuccess(
        'File Loaded Successfully',
        `Extracted ${extractedText.length} characters from ${file.name}`
      );
    } catch (error) {
      logError('handleFileSelect', error, { fileName: file.name, fileSize: file.size });
      handleError(error, 'FileExtraction');
      setSelectedFile(null);
      setFileContent('');
    } finally {
      setExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!fileContent.trim()) {
      handleError(
        new Error('Please upload a file or paste study material'),
        'FileUploadScreen'
      );
      return;
    }

    const questionCount = parseInt(numQuestions, 10);
    if (isNaN(questionCount) || questionCount < 1) {
      handleError(
        new Error('Please enter a valid number of questions (minimum 1)'),
        'FileUploadScreen'
      );
      return;
    }

    if (questionCount > 100) {
      handleError(
        new Error('Maximum 100 questions allowed'),
        'FileUploadScreen'
      );
      return;
    }

    if (!setTitle.trim() && !existingSet) {
      handleError(
        new Error('Please enter a set title'),
        'FileUploadScreen'
      );
      return;
    }

    setLoading(true);
    try {
      console.log(`[FileUploadScreen] Starting question generation with ${questionCount} questions`);
      const questions = await generateQuestionsFromText(fileContent, questionCount);

      if (!questions || questions.length === 0) {
        logError(
          'handleGenerate',
          new Error('No questions generated'),
          { questionCount, contentLength: fileContent.length }
        );
        handleError(
          new Error('No questions could be generated. Try with more detailed content.'),
          'AIGeneration'
        );
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

      showSuccess(
        'Questions Generated',
        `Successfully generated ${questions.length} questions!`
      );
      console.log(`[FileUploadScreen] Successfully generated ${questions.length} questions`);
    } catch (error) {
      logError('handleGenerate', error, {
        questionCount,
        contentLength: fileContent.length,
        hasTitle: !!setTitle.trim(),
      });
      handleError(error, 'QuestionGeneration');
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
          <Text style={styles.title}>Generate Questions from File</Text>
          <Text style={styles.subtitle}>Upload DOCX/TXT files or paste text</Text>
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
          <Text style={styles.sectionLabel}>Study Material Input</Text>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeButton, inputMode === 'file' && styles.modeButtonActive]}
              onPress={() => setInputMode('file')}
            >
              <Text style={[styles.modeButtonText, inputMode === 'file' && styles.modeButtonTextActive]}>
                📁 Upload File
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, inputMode === 'text' && styles.modeButtonActive]}
              onPress={() => setInputMode('text')}
            >
              <Text style={[styles.modeButtonText, inputMode === 'text' && styles.modeButtonTextActive]}>
                📝 Paste Text
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {inputMode === 'file' ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.filePickerButton, extracting && styles.filePickerButtonDisabled]}
              onPress={triggerFileInput}
              disabled={extracting}
              activeOpacity={0.8}
            >
              {extracting ? (
                <>
                  <ActivityIndicator color="#f8fafc" size="small" />
                  <Text style={styles.filePickerButtonText}>Extracting text...</Text>
                </>
              ) : selectedFile ? (
                <>
                  <Text style={styles.filePickerButtonIcon}>✅</Text>
                  <Text style={styles.filePickerButtonText}>{selectedFile.name}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.filePickerButtonIcon}>📄</Text>
                  <Text style={styles.filePickerButtonText}>Tap to select DOCX or TXT file</Text>
                  <Text style={styles.filePickerHint}>Max 10MB</Text>
                </>
              )}
            </TouchableOpacity>
            {selectedFile && fileContent && (
              <Text style={styles.extractedInfo}>
                ✓ Extracted {fileContent.length} characters
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Paste Your Content</Text>
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
        )}

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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
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
  modeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modeButtonTextActive: {
    color: '#f8fafc',
  },
  filePickerButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  filePickerButtonDisabled: {
    opacity: 0.7,
  },
  filePickerButtonIcon: {
    fontSize: 40,
  },
  filePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  filePickerHint: {
    fontSize: 12,
    color: '#64748b',
  },
  extractedInfo: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
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
