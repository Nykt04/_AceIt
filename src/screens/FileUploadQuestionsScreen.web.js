import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { generateQuestionsFromText, generateStudyDeck } from '../services/aiService';
import { extractTextFromFile, getFileValidationError } from '../services/fileService';
import soundManager from '../services/soundService';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';
import { showSuccess, showError } from '../services/notificationService';

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
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'text'

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.playButtonClick();
    const error = getFileValidationError(file);
    if (error) {
      showError(error);
      return;
    }

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!setTitle.trim()) {
      setSetTitle(fileNameWithoutExt);
    }

    setSelectedFile(file);
    setExtracting(true);

    try {
      const result = await extractTextFromFile(file);

      if (result.isEmpty) {
        throw new Error(result.warning || 'The file contains no readable text or only images.');
      }

      const extractedText = result.text || '';
      if (!extractedText.trim()) {
        throw new Error('The file appears to be empty.');
      }

      setFileContent(extractedText);
      soundManager.playSuccess();
      showSuccess(`Loaded ${file.name} (${extractedText.length} characters)`);
    } catch (err) {
      showError(err.message || 'Failed to extract text from file');
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
    soundManager.playButtonClick();
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!fileContent.trim()) {
      showError('Please select a file or paste your notes first');
      return;
    }

    const questionCount = parseInt(numQuestions, 10);
    if (isNaN(questionCount) || questionCount < 1) {
      showError('Enter a valid count of questions (minimum 1)');
      return;
    }

    if (!setTitle.trim() && !existingSet) {
      showError('Please enter a title for your study deck');
      return;
    }

    soundManager.playButtonClick();
    setLoading(true);

    try {
      let questions = [];
      let terms = [];

      try {
        const deckResult = await generateStudyDeck(fileContent, {
          questionCount,
          flashcardCount: questionCount,
          isDocument: true,
        });
        questions = deckResult.questions || [];
        terms = deckResult.flashcards || [];
      } catch {
        // Fallback to direct questions generator
        questions = await generateQuestionsFromText(fileContent, questionCount);
        terms = questions.map((q, i) => ({
          id: `t-${Date.now()}-${i}`,
          term: q.type === 'true_false' ? `Concept #${i + 1}` : (q.options?.[q.correctIndex] || `Key Term #${i + 1}`),
          definition: q.explanation || q.question,
        }));
      }

      if ((!questions || questions.length === 0) && (!terms || terms.length === 0)) {
        showError('No content could be extracted. Provide more detailed study notes.');
        return;
      }

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
          description: selectedFile
            ? `Extracted from ${selectedFile.name}`
            : 'Generated from pasted notes',
          terms,
          questions,
        });
        showSuccess(`Created deck "${setTitle.trim()}" with ${questions.length} questions`);
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (err) {
      showError(err.message || 'Failed to synthesize questions');
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
              Upload documents or paste lecture notes. AceIt automatically creates flashcards and quiz questions.
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

          {/* 2. Ingestion Mode Switcher */}
          <BrutalCard
            headerTitle="2. INPUT SOURCE"
            accentColor={theme.accent || '#FCD34D'}
            style={{ marginBottom: 16 }}
          >
            {/* Mode Switcher Buttons */}
            <View style={styles.modeToggleRow}>
              <Pressable
                onPress={() => {
                  soundManager.playButtonClick();
                  setInputMode('file');
                }}
                style={({ pressed }) => [
                  styles.modeBtn,
                  {
                    backgroundColor: inputMode === 'file' ? theme.primary : theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    transform: [
                      { translateX: pressed || inputMode === 'file' ? 2 : 0 },
                      { translateY: pressed || inputMode === 'file' ? 2 : 0 },
                    ],
                  },
                  Platform.OS === 'web' && {
                    boxShadow: inputMode === 'file'
                      ? `1px 1px 0px ${shadowColor}`
                      : pressed
                      ? `1px 1px 0px ${shadowColor}`
                      : `3px 3px 0px ${shadowColor}`,
                    cursor: 'pointer',
                  },
                ]}
              >
                <MaterialIcons
                  name="upload-file"
                  size={18}
                  color={inputMode === 'file' ? '#FFFFFF' : theme.text}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: inputMode === 'file' ? '#FFFFFF' : theme.text },
                  ]}
                >
                  UPLOAD DOCUMENT
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  soundManager.playButtonClick();
                  setInputMode('text');
                }}
                style={({ pressed }) => [
                  styles.modeBtn,
                  {
                    backgroundColor: inputMode === 'text' ? theme.primary : theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    transform: [
                      { translateX: pressed || inputMode === 'text' ? 2 : 0 },
                      { translateY: pressed || inputMode === 'text' ? 2 : 0 },
                    ],
                  },
                  Platform.OS === 'web' && {
                    boxShadow: inputMode === 'text'
                      ? `1px 1px 0px ${shadowColor}`
                      : pressed
                      ? `1px 1px 0px ${shadowColor}`
                      : `3px 3px 0px ${shadowColor}`,
                    cursor: 'pointer',
                  },
                ]}
              >
                <MaterialIcons
                  name="edit-note"
                  size={18}
                  color={inputMode === 'text' ? '#FFFFFF' : theme.text}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: inputMode === 'text' ? '#FFFFFF' : theme.text },
                  ]}
                >
                  PASTE TEXT NOTES
                </Text>
              </Pressable>
            </View>

            {inputMode === 'file' ? (
              <Pressable
                onPress={triggerFileInput}
                disabled={extracting}
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
                    cursor: extracting ? 'wait' : 'pointer',
                    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                  },
                ]}
              >
                {extracting ? (
                  <View style={styles.emptyUploadView}>
                    <MaterialIcons name="hourglass-empty" size={38} color={theme.accent || '#FCD34D'} />
                    <Text style={[styles.uploadPromptTitle, { color: theme.text }]}>
                      EXTRACTING TEXT & RUNNING OCR...
                    </Text>
                    <Text style={[styles.uploadPromptDesc, { color: theme.textSecondary }]}>
                      Processing document pages and images
                    </Text>
                  </View>
                ) : selectedFile ? (
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
                        {selectedFile.name}
                      </Text>
                      <Text style={[styles.fileSizeText, { color: theme.textSecondary }]}>
                        {(selectedFile.size / 1024).toFixed(1)} KB • {fileContent.length} characters extracted
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
                      CLICK TO SELECT DOCX, PDF, OR TXT FILE
                    </Text>
                    <Text style={[styles.uploadPromptDesc, { color: theme.textSecondary }]}>
                      Upload lecture notes, summaries, or syllabi (Max 10MB)
                    </Text>
                    <View style={styles.formatTagsRow}>
                      <View style={[styles.formatTag, { borderColor }]}>
                        <Text style={[styles.formatTagText, { color: theme.textSecondary }]}>.TXT</Text>
                      </View>
                      <View style={[styles.formatTag, { borderColor }]}>
                        <Text style={[styles.formatTagText, { color: theme.textSecondary }]}>.DOCX</Text>
                      </View>
                      <View style={[styles.formatTag, { borderColor }]}>
                        <Text style={[styles.formatTagText, { color: theme.textSecondary }]}>.PDF</Text>
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            ) : (
              <View style={styles.pasteAreaContainer}>
                <TextInput
                  style={[
                    styles.textArea,
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
                  placeholder="Paste lecture text, book chapters, or revision notes directly here..."
                  placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                  value={fileContent}
                  onChangeText={setFileContent}
                  multiline
                  numberOfLines={8}
                />
                <Text style={[styles.charCountText, { color: theme.textSecondary }]}>
                  {fileContent.length} characters entered
                </Text>
              </View>
            )}
          </BrutalCard>

          {/* 3. Question Quantity Card */}
          <BrutalCard
            headerTitle="3. QUANTITY OF QUESTIONS"
            accentColor={theme.brandSecondary || '#F97316'}
            style={{ marginBottom: 20 }}
          >
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              How many questions to extract:
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
            title={loading ? 'SYNTHESIZING QUESTIONS...' : 'EXTRACT QUESTIONS WITH AI'}
            variant="primary"
            icon={<MaterialIcons name="auto-awesome" size={22} color="#FFFFFF" />}
            onPress={handleGenerate}
            disabled={loading}
          />

          {/* Hidden File Input for Web Browser */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
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
  modeToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  uploadZone: {
    padding: 24,
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
  pasteAreaContainer: {
    marginTop: 4,
  },
  textArea: {
    padding: 14,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 140,
    textAlignVertical: 'top',
  },
  charCountText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
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
