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
          
          // Auto-populate title from filename (without extension)
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setSetTitle(fileNameWithoutExt);
          
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
        navigation.navigate('SetDetail', {
          set: { ...existingSet, questions: [...existing, ...questions], terms: [...existingTerms, ...terms] },
        });
      } else {
        const newSet = await addStudySet({
          title: setTitle.trim(),
          description: 'AI-generated from study material',
          terms,
          questions,
        });
        navigation.replace('SetDetail', { set: newSet });
      }

      Alert.alert('Success', `Generated ${questions.length} questions and terms using AI!`);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Generate from File</Text>
          <Text style={styles.headerSubtitle}>Upload DOCX, PDF, or TXT files</Text>
        </View>
        <TouchableOpacity onPress={handleGenerateFromFile} disabled={loading} activeOpacity={0.8}>
          <Text style={[styles.generate, loading && styles.generateDisabled]}>{loading ? '…' : 'Go'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Set Title (if not existing set) */}
        {!existingSet && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>✏️</Text>
              <Text style={styles.sectionTitle}>Set Title</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g., Biology Notes, History Chapter 5"
              placeholderTextColor={theme.textTertiary}
              value={setTitle}
              onChangeText={setSetTitle}
            />
          </View>
        )}

        {/* File Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📁</Text>
            <Text style={styles.sectionTitle}>Upload Document</Text>
          </View>
          
          <View style={styles.fileBox}>
            {!selectedFile ? (
              <>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={styles.fileText}>No file selected</Text>
                <Text style={styles.fileHint}>Upload .txt, .docx, or .pdf</Text>
              </>
            ) : (
              <>
                <Text style={styles.fileIcon}>✅</Text>
                <Text style={styles.fileText}>{fileName}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(2)} KB • {fileContent.length} characters
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectFile}
            activeOpacity={0.8}
          >
            <Text style={styles.selectButtonIcon}>📂</Text>
            <Text style={styles.selectButtonText}>Select File</Text>
          </TouchableOpacity>
        </View>

        {/* Number of Questions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={styles.sectionTitle}>Number of Questions</Text>
          </View>
          
          <View style={styles.questionInputContainer}>
            <Text style={styles.inputPrefix}>📝</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="e.g., 10, 20, 30..."
              placeholderTextColor={theme.textTertiary}
              value={numQuestions}
              onChangeText={setNumQuestions}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 How It Works</Text>
          <Text style={styles.tipItem}>1️⃣ Upload your study material</Text>
          <Text style={styles.tipItem}>2️⃣ Specify number of questions</Text>
          <Text style={styles.tipItem}>3️⃣ AI generates both questions and terms</Text>
          <Text style={styles.tipItem}>4️⃣ Review and study instantly</Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerateFromFile}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#f5f5f5" size="small" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Text style={styles.generateButtonText}>Generate Questions</Text>
            </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cancel: {
    fontSize: 18,
    color: theme.textSecondary,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  generate: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primaryAccent,
  },
  generateDisabled: {
    color: theme.textTertiary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },

  // Section Styling
  section: {
    marginBottom: 24,
    backgroundColor: theme.secondary,
    borderRadius: 16,
    padding: 18,
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
    marginBottom: 14,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },

  // Input
  input: {
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },

  // File Box
  fileBox: {
    backgroundColor: theme.background,
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primaryAccent + '30',
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  fileIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  fileText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
  },
  fileHint: {
    fontSize: 12,
    color: theme.textTertiary,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: theme.primaryAccent,
    marginTop: 10,
    fontWeight: '600',
  },

  // Select Button
  selectButton: {
    backgroundColor: theme.primaryAccent,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  selectButtonIcon: {
    fontSize: 18,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5f5f5',
  },

  // Question Input
  questionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.border,
    marginBottom: 10,
  },
  inputPrefix: {
    fontSize: 18,
    paddingLeft: 12,
  },
  questionInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },
  questionInputHint: {
    fontSize: 12,
    color: theme.textTertiary,
    fontWeight: '500',
  },

  // Tips Box
  tipsBox: {
    backgroundColor: theme.primaryAccent + '10',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: theme.primaryAccent + '30',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },

  // Generate Button
  generateButton: {
    backgroundColor: theme.primaryAccent,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: theme.primaryAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonIcon: {
    fontSize: 18,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f5f5f5',
  },
});
