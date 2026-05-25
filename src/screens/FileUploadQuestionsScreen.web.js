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
import { useTheme } from '../context/ThemeContext';
import { generateQuestionsFromText } from '../services/aiService';
import { extractTextFromFile, getFileValidationError } from '../services/fileService';
import { handleError, showSuccess, logError } from '../services/notificationService';

export default function FileUploadQuestionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
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

  const styles = createStyles(theme);

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
      const result = await extractTextFromFile(file);

      // Handle the result object with {text, isEmpty, warning}
      if (result.isEmpty) {
        const errorMsg = result.warning || 'The file appears to be empty or contains no readable text.';
        throw new Error(errorMsg);
      }

      const extractedText = result.text || '';
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

    // Warn for very large numbers but still allow them
    if (questionCount > 250) {
      const shouldContinue = window.confirm(
        `You're requesting ${questionCount} questions. This may take a while and use more API tokens. Continue?`
      );
      if (!shouldContinue) return;
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
          <Text style={styles.subtitle}>Upload DOCX/PDF/TXT files or paste text</Text>
        </View>

        {!existingSet && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Set Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter set title"
              placeholderTextColor={theme.textTertiary}
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
                 Upload File
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, inputMode === 'text' && styles.modeButtonActive]}
              onPress={() => setInputMode('text')}
            >
              <Text style={[styles.modeButtonText, inputMode === 'text' && styles.modeButtonTextActive]}>
                Paste Text
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
                  <ActivityIndicator color={theme.text} size="small" />
                  <Text style={styles.filePickerButtonText}>Extracting text...</Text>
                </>
              ) : selectedFile ? (
                <>
                  <Text style={styles.filePickerButtonText}>{selectedFile.name}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.filePickerButtonText}>Tap to select DOCX, PDF,  or TXT file</Text>
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
              placeholderTextColor={theme.textTertiary}
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
              placeholderTextColor={theme.textTertiary}
              value={numQuestions}
              onChangeText={setNumQuestions}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={loading ? 1 : 0.8}
        >
          {loading ? (
            <ActivityIndicator color="#f5f5f5" size="large" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Questions</Text>
          )}
        </TouchableOpacity>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
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
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
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
    backgroundColor: theme.secondary,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: theme.primaryAccent,
    borderColor: theme.primaryAccent,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  modeButtonTextActive: {
    color: theme.text,
  },
  filePickerButton: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
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
    color: theme.text,
    textAlign: 'center',
  },
  filePickerHint: {
    fontSize: 12,
    color: theme.textTertiary,
  },
  extractedInfo: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 16,
    color: theme.text,
  },
  textArea: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 16,
    color: theme.text,
    minHeight: 180,
  },
  questionInputContainer: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  questionInput: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    backgroundColor: theme.background,
  },
  questionInputHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  generateButton: {
    backgroundColor: theme.primaryAccent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 1,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f5f5f5',
  },
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
