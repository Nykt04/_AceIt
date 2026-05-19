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
import { useTheme } from '../context/ThemeContext';
import { generateQuestionsFromText } from '../services/aiService';

export default function FileUploadQuestionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const existingSet = route.params?.existingSet;
  const { addStudySet, updateStudySet } = useStudy();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [loading, setLoading] = useState(false);
  const [setTitle, setSetTitle] = useState(existingSet?.title ?? '');

  const styles = createStyles(theme);

  // Extract text from file content
  const extractTextFromFile = async (fileUri, fileName) => {
    const fileNameLower = fileName.toLowerCase();
    
    // For text files, read the content directly
    if (fileNameLower.endsWith('.txt')) {
      try {
        const response = await fetch(fileUri);
        const text = await response.text();
        
        if (!text || text.trim().length < 5) {
          throw new Error('Text file is empty or too short');
        }
        
        return { text, isEmpty: false };
      } catch (error) {
        Alert.alert('Error', 'Failed to read text file or file is empty');
        return null;
      }
    }
    
    // For DOCX files
    if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
      try {
        const response = await fetch(fileUri);
        const arrayBuffer = await response.arrayBuffer();
        
        // Since we're in React Native, we can't directly use mammoth
        // Show user instructions for image-containing documents
        Alert.alert(
          '⚠️ Important',
          'Document files with images need special handling.\n\n' +
          '✅ SOLUTION:\n' +
          '1. If your document contains images:\n' +
          '   - Use an OCR tool (Google Lens, smallpdf.com)\n' +
          '   - Extract text and save as .txt file\n' +
          '   - Upload the .txt file\n\n' +
          '2. If your document is text-only:\n' +
          '   - It should work fine\n' +
          '   - Try again',
          [{ text: 'OK' }]
        );
        
        // Return placeholder - in real scenario, would need backend support
        return { 
          text: `[Document: ${fileName}]\n\nPlease ensure your document contains extractable text.`, 
          isEmpty: true,
          warning: true 
        };
      } catch (error) {
        Alert.alert('Error', 'Failed to process document file');
        return null;
      }
    }

    // For PDF files
    if (fileNameLower.endsWith('.pdf')) {
      Alert.alert(
        '📄 PDF File Detected',
        'PDF support in React Native requires uploading through the web version.\n\n' +
        '✅ SOLUTION:\n' +
        '1. Access Study Buddy on a web browser\n' +
        '2. Upload your PDF file there\n' +
        '3. Or convert PDF to text:\n' +
        '   - Use ilovepdf.com or smallpdf.com\n' +
        '   - Save as .txt file\n' +
        '   - Upload the .txt file in this app',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    // For image files
    if (fileNameLower.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      Alert.alert(
        '📸 Image File Detected',
        'Direct image uploads are not yet supported.\n\n' +
        'PLEASE:\n' +
        '1. Convert your image to text using:\n' +
        '   • Google Lens (take screenshot)\n' +
        '   • Online OCR: ilovepdf.com, smallpdf.com\n' +
        '   • Microsoft Lens\n\n' +
        '2. Save the text as a .txt file\n' +
        '3. Upload the .txt file instead',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    // For unsupported file types
    Alert.alert('Unsupported File Type', `${fileNameLower} files are not directly supported. Please use .txt, .docx, or .pdf files with text content.`);
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
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const file = {
          uri: result.uri,
          name: result.name,
          size: result.size ?? 0,
        };

        const extractedData = await extractTextFromFile(file.uri, file.name);
        
        if (extractedData) {
          setSelectedFile(file);
          setFileName(file.name);
          
          // Check if content is empty or has warning
          if (extractedData.isEmpty || extractedData.warning) {
            setFileContent(''); // Don't set placeholder text
            Alert.alert(
              'Cannot Process File',
              'This file appears to contain only images or is incompatible.\n\n' +
              '📝 SOLUTION:\n' +
              'Convert your images to text first:\n' +
              '1. Use Google Lens\n' +
              '2. Use online OCR tool\n' +
              '3. Save extracted text as .txt file\n' +
              '4. Upload the .txt file'
            );
          } else {
            setFileContent(extractedData.text);
            Alert.alert('Success', `File ready: ${file.name}\n\n${extractedData.text.length} characters extracted`);
          }
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select file: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleGenerateFromFile = async () => {
    if (!fileContent.trim()) {
      Alert.alert(
        'No Content',
        'Please select a file with text content first.\n\n' +
        '💡 If your file contains images:\n' +
        '1. Use an OCR tool to extract text\n' +
        '2. Save as .txt file\n' +
        '3. Upload the .txt file'
      );
      return;
    }

    // Minimum text requirement
    if (fileContent.trim().length < 20) {
      Alert.alert('Insufficient Content', 'Please provide more study material (at least 20 characters)');
      return;
    }
    
    const questionCount = parseInt(numQuestions, 10);
    if (isNaN(questionCount) || questionCount < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of questions (minimum 1)');
      return;
    }
    
    // Warn for very large numbers but still allow them
    if (questionCount > 250) {
      Alert.alert(
        'Large Question Set',
        `You're requesting ${questionCount} questions. This may take a while. Continue?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: async () => {
              await proceedWithGeneration(questionCount);
            },
          },
        ]
      );
      return;
    }
    
    await proceedWithGeneration(questionCount);
  };

  const proceedWithGeneration = async (questionCount) => {
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
              placeholderTextColor={theme.textTertiary}
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
              placeholderTextColor={theme.textTertiary}
              value={numQuestions}
              onChangeText={setNumQuestions}
              keyboardType="number-pad"
            />
            <Text style={styles.questionInputHint}>Min: 1 | Recommended: 5-50 | Max: 250+</Text>
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
            <ActivityIndicator color="#f5f5f5" size="large" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Questions</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 36,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 16,
    color: theme.text,
  },
  fileBox: {
    backgroundColor: theme.secondary,
    borderRadius: 14,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
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
    color: theme.text,
    marginBottom: 8,
  },
  fileHint: {
    fontSize: 13,
    color: theme.textTertiary,
  },
  fileSize: {
    fontSize: 13,
    color: theme.primaryAccent,
    marginTop: 12,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: theme.primaryAccent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f5f5',
  },
  questionInputContainer: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionInput: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
  },
  questionInputHint: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 12,
    paddingHorizontal: 2,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: theme.secondary,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: theme.primaryAccent,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 11,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: theme.primaryAccent,
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
    color: '#f5f5f5',
  },
});
