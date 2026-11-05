import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { generateQuestionsFromText } from '../services/aiService';
import soundManager from '../services/soundService';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';
import { showSuccess, showError } from '../services/notificationService';

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

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  // Extract text from file content
  const extractTextFromFile = async (fileUri, fName) => {
    const fileNameLower = fName.toLowerCase();

    if (fileNameLower.endsWith('.txt')) {
      try {
        const response = await fetch(fileUri);
        const text = await response.text();

        if (!text || text.trim().length < 5) {
          throw new Error('Text file is empty or too short');
        }

        return { text, isEmpty: false };
      } catch (error) {
        showError('Failed to read text file or file is empty');
        return null;
      }
    }

    if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
      try {
        const response = await fetch(fileUri);
        await response.arrayBuffer();
        return {
          text: `[Document: ${fName}]\n\nPlease ensure your document contains plain text notes.`,
          isEmpty: true,
          warning: true,
        };
      } catch (error) {
        showError('Failed to process document file');
        return null;
      }
    }

    if (fileNameLower.endsWith('.pdf')) {
      Alert.alert(
        'PDF Detected',
        'Direct PDF parsing in browser requires plain text. Please save your notes as a .txt file or paste them into a text document.',
        [{ text: 'OK' }]
      );
      return null;
    }

    showError(`Unsupported file format. Please use .txt or .docx notes.`);
    return null;
  };

  const handleSelectFile = async () => {
    soundManager.playButtonClick();
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

      if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
        const asset = result.assets ? result.assets[0] : result;
        const file = {
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? 0,
        };

        const extractedData = await extractTextFromFile(file.uri, file.name);

        if (extractedData) {
          setSelectedFile(file);
          setFileName(file.name);

          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          if (!setTitle.trim()) {
            setSetTitle(fileNameWithoutExt);
          }

          if (extractedData.isEmpty || extractedData.warning) {
            setFileContent('');
            showError('File contains minimal text. Please provide notes with extractable content.');
          } else {
            setFileContent(extractedData.text);
            showSuccess(`File loaded: ${file.name} (${extractedData.text.length} chars)`);
          }
        }
      }
    } catch (err) {
      showError('Failed to select file: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleGenerateFromFile = async () => {
    if (!fileContent.trim()) {
      showError('Please upload a file with study text first');
      return;
    }

    if (fileContent.trim().length < 20) {
      showError('Insufficient study material (minimum 20 characters required)');
      return;
    }

    const questionCount = parseInt(numQuestions, 10);
    if (isNaN(questionCount) || questionCount < 1) {
      showError('Enter a valid count of questions (minimum 1)');
      return;
    }

    if (!setTitle.trim() && !existingSet) {
      showError('Please enter a study deck title');
      return;
    }

    soundManager.playButtonClick();
    setLoading(true);

    try {
      const questions = await generateQuestionsFromText(fileContent, questionCount);

      if (!questions || questions.length === 0) {
        showError('No questions generated. Try uploading more detailed notes.');
        return;
      }

      const terms = questions.map((q) => ({
        term: q.question || 'Question',
        definition: q.explanation || q.correctAnswer?.toString() || 'Answer',
      }));

      soundManager.playSuccess();

      if (existingSet) {
        const existing = existingSet.questions || [];
        const existingTerms = existingSet.terms || [];
        await updateStudySet(existingSet.id, {
          questions: [...existing, ...questions],
          terms: [...existingTerms, ...terms],
        });
        showSuccess(`Generated ${questions.length} questions for ${existingSet.title}`);
        navigation.navigate('SetDetail', {
          set: {
            ...existingSet,
            questions: [...existing, ...questions],
            terms: [...existingTerms, ...terms],
          },
        });
      } else {
        const newSet = await addStudySet({
          title: setTitle.trim(),
          description: `Extracted from ${fileName || 'study notes'}`,
          terms,
          questions,
        });
        showSuccess(`Created new deck "${setTitle.trim()}" with ${questions.length} questions`);
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (error) {
      showError(error.message || 'Failed to generate questions from file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* Hero Banner */}
          <View
            style={[
              styles.heroBanner,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              Platform.OS === 'web' && {
                boxShadow: `4px 4px 0px ${shadowColor}`,
              },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor: theme.accent || '#FCD34D',
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                  },
                ]}
              >
                <Text style={styles.heroBadgeText}>DOCUMENT INGESTION // OCR & TEXT</Text>
              </View>
              {existingSet && (
                <View
                  style={[
                    styles.contextPill,
                    {
                      backgroundColor: theme.primary,
                      borderColor: borderColor,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={styles.contextPillText}>TARGET: {existingSet.title}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>
              UPLOAD STUDY MATERIAL
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Convert lecture slides, outlines, or text notes directly into interactive flashcards.
            </Text>
          </View>

          {/* 1. Deck Title Card (if not appending) */}
          {!existingSet && (
            <BrutalCard
              headerTitle="1. STUDY DECK TITLE"
              accentColor={theme.primary}
              style={{ marginBottom: 16 }}
            >
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Name for your new study deck:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    color: theme.text,
                  },
                  Platform.OS === 'web' && {
                    boxShadow: `2px 2px 0px ${shadowColor}`,
                  },
                ]}
                placeholder="e.g. Chapter 4 Cellular Biology, Midterm Exam Notes"
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={setTitle}
                onChangeText={setSetTitle}
                editable={!loading}
              />
            </BrutalCard>
          )}

          {/* 2. Upload Document Card */}
          <BrutalCard
            headerTitle="2. SELECT STUDY DOCUMENT"
            accentColor={theme.accent || '#FCD34D'}
            style={{ marginBottom: 16 }}
          >
            {/* File Drop/Pick Area */}
            <Pressable
              onPress={handleSelectFile}
              style={({ pressed }) => [
                styles.uploadZone,
                {
                  backgroundColor: theme.background,
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                  transform: [
                    { translateX: pressed ? 1 : 0 },
                    { translateY: pressed ? 1 : 0 },
                  ],
                },
                Platform.OS === 'web' && {
                  boxShadow: pressed
                    ? `1px 1px 0px ${shadowColor}`
                    : `3px 3px 0px ${shadowColor}`,
                  cursor: 'pointer',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                },
              ]}
            >
              {selectedFile ? (
                <View style={styles.selectedFileView}>
                  <View
                    style={[
                      styles.iconStamp,
                      {
                        backgroundColor: '#10B981',
                        borderColor: borderColor,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <MaterialIcons name="check" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.fileDetailsCol}>
                    <Text style={[styles.fileNameText, { color: theme.text }]} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <Text style={[styles.fileSizeText, { color: theme.textSecondary }]}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {fileContent.length} characters ready
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.changePill,
                      {
                        backgroundColor: theme.primary,
                        borderColor: borderColor,
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <Text style={styles.changePillText}>CHANGE</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyUploadView}>
                  <MaterialIcons name="cloud-upload" size={38} color={theme.primary} />
                  <Text style={[styles.uploadPromptTitle, { color: theme.text }]}>
                    CHOOSE STUDY DOCUMENT (.TXT, .DOCX)
                  </Text>
                  <Text style={[styles.uploadPromptDesc, { color: theme.textSecondary }]}>
                    Click here to select study files from your device
                  </Text>
                  <View style={styles.formatTagsRow}>
                    <View style={[styles.formatTag, { borderColor }]}>
                      <Text style={[styles.formatTagText, { color: theme.textSecondary }]}>.TXT</Text>
                    </View>
                    <View style={[styles.formatTag, { borderColor }]}>
                      <Text style={[styles.formatTagText, { color: theme.textSecondary }]}>.DOCX</Text>
                    </View>
                  </View>
                </View>
              )}
            </Pressable>
          </BrutalCard>

          {/* 3. Question Quantity Card */}
          <BrutalCard
            headerTitle="3. QUANTITY OF QUESTIONS"
            accentColor={theme.brandSecondary || '#F97316'}
            style={{ marginBottom: 20 }}
          >
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              How many questions to extract from the material:
            </Text>
            <View style={styles.chipsRow}>
              {['3', '5', '10', '15', '20'].map((val) => {
                const isSelected = numQuestions === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => {
                      soundManager.playButtonClick();
                      setNumQuestions(val);
                    }}
                    style={({ pressed }) => [
                      styles.chipBtn,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.background,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                        transform: [
                          { translateX: pressed || isSelected ? 2 : 0 },
                          { translateY: pressed || isSelected ? 2 : 0 },
                        ],
                      },
                      Platform.OS === 'web' && {
                        boxShadow: isSelected
                          ? `1px 1px 0px ${shadowColor}`
                          : pressed
                          ? `1px 1px 0px ${shadowColor}`
                          : `3px 3px 0px ${shadowColor}`,
                        cursor: 'pointer',
                        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {val}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </BrutalCard>

          {/* Action Button */}
          <BrutalButton
            title={loading ? 'EXTRACTING & SYNTHESIZING...' : 'EXTRACT QUESTIONS FROM DOCUMENT'}
            variant="primary"
            icon={<MaterialIcons name="auto-awesome" size={22} color="#FFFFFF" />}
            onPress={handleGenerateFromFile}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    letterSpacing: 0.8,
  },
  contextPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  contextPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  uploadZone: {
    padding: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyUploadView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  uploadPromptDesc: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  formatTagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  formatTagText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  selectedFileView: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  iconStamp: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetailsCol: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  fileSizeText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  changePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
  changePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBtnText: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
});
