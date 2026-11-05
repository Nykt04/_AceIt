import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { exportStudySet } from '../services/exportService';
import { generateQuestionsFromTerms } from '../services/aiService';
import soundManager from '../services/soundService';
import EditableFlashcard from '../components/EditableFlashcard';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

export default function SetDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { studySets, deleteStudySet, updateStudySet } = useStudy();
  const setFromParams = route.params?.set;
  const [showFlashcardEditor, setShowFlashcardEditor] = useState(false);
  const [set, setSet] = useState(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const currentSet = studySets.find((s) => s.id === setFromParams?.id) || setFromParams;
    setSet(currentSet);
  }, [studySets, setFromParams]);

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  if (!set) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.navBar, { borderBottomColor: borderColor, borderBottomWidth: borderWidth }]}>
          <BrutalButton
            title="BACK"
            variant="outline"
            icon={<MaterialIcons name="arrow-back" size={18} color={theme.text} />}
            onPress={() => navigation.goBack()}
          />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.text }]}>Set not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const termsOnly = set.terms?.length || 0;
  const questionsOnly = set.questions?.length || 0;
  const hasContent = termsOnly > 0 || questionsOnly > 0;

  const onDelete = async () => {
    soundManager.playButtonClick();
    const proceed =
      Platform.OS === 'web'
        ? window.confirm(`Delete "${set.title}"?`)
        : await new Promise((res) => {
            Alert.alert('Delete set', `Delete "${set.title}"?`, [
              { text: 'Cancel', style: 'cancel', onPress: () => res(false) },
              { text: 'Delete', style: 'destructive', onPress: () => res(true) },
            ]);
          });
    if (!proceed) return;
    const ok = await deleteStudySet(set.id);
    if (!ok) {
      Alert.alert('Error', 'Could not delete the set.');
      return;
    }
    navigation.goBack();
  };

  const handleEditTerm = async (index, updatedTerm) => {
    const updatedTerms = [...(set.terms || [])];
    updatedTerms[index] = updatedTerm;
    await updateStudySet(set.id, { terms: updatedTerms });
    Alert.alert('Success', 'Term updated!');
  };

  const handleDeleteTerm = (index) => {
    if (!set || !set.terms || !set.terms[index]) return;
    const termToDelete = set.terms[index];
    const termName = termToDelete?.term || 'this term';

    const performDelete = async () => {
      try {
        const updatedTerms = set.terms.filter((_, i) => i !== index);
        await updateStudySet(set.id, { terms: updatedTerms });
      } catch (error) {
        Alert.alert('Error', 'Failed to delete term: ' + error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${termName}"?`)) performDelete();
    } else {
      Alert.alert('Delete Term', `Delete "${termName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const handleEditQuestion = async (index, updatedQuestion) => {
    const updatedQuestions = [...(set.questions || [])];
    updatedQuestions[index] = updatedQuestion;
    await updateStudySet(set.id, { questions: updatedQuestions });
    Alert.alert('Success', 'Question updated!');
  };

  const handleDeleteQuestion = (index) => {
    const performDelete = async () => {
      try {
        const updatedQuestions = set.questions.filter((_, i) => i !== index);
        await updateStudySet(set.id, { questions: updatedQuestions });
      } catch (error) {
        Alert.alert('Error', 'Failed to delete question: ' + error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this question?')) performDelete();
    } else {
      Alert.alert('Delete Question', 'Delete this question?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const handleAddTerm = async () => {
    const updatedTerms = [...(set.terms || []), { term: '', definition: '' }];
    await updateStudySet(set.id, { terms: updatedTerms });
  };

  const handleConvertToQuestions = async () => {
    const validTerms = (set.terms || []).filter((t) => t.term.trim() && t.definition.trim());
    if (validTerms.length === 0) {
      Alert.alert('No terms', 'Add at least one term with both term and definition to convert.');
      return;
    }

    setConverting(true);
    try {
      const generatedQuestions = await generateQuestionsFromTerms(validTerms, validTerms.length);
      if (!generatedQuestions || generatedQuestions.length === 0) {
        Alert.alert('No questions generated', 'Try again or add more detailed terms.');
        return;
      }
      const existingQuestions = set.questions || [];
      const allQuestions = [...existingQuestions, ...generatedQuestions];
      await updateStudySet(set.id, { questions: allQuestions });
      setSet({ ...set, questions: allQuestions });
      Alert.alert('Success', `Generated ${generatedQuestions.length} questions from terms!`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to convert terms');
    } finally {
      setConverting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View
        style={[
          styles.navBar,
          {
            borderBottomColor: borderColor,
            borderBottomWidth: borderWidth,
            backgroundColor: theme.background,
          },
        ]}
      >
        <BrutalButton
          title="BACK TO DECKS"
          variant="outline"
          icon={<MaterialIcons name="arrow-back" size={18} color={theme.text} />}
          onPress={() => navigation.goBack()}
        />
        <BrutalBadge
          label={`${termsOnly + questionsOnly} ITEMS`}
          color={theme.accent || '#FFDE59'}
          textColor="#121212"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Set Header Card */}
        <BrutalCard accentColor={theme.primary} headerTitle="STUDY DECK OVERVIEW">
          <Text style={[styles.title, { color: theme.text }]}>{set.title}</Text>
          {set.description ? (
            <Text style={[styles.desc, { color: theme.textSecondary }]}>
              {set.description}
            </Text>
          ) : null}

          <View style={styles.badgeRow}>
            <BrutalBadge
              label={`${termsOnly} TERMS`}
              color={theme.primary}
              textColor="#FFFFFF"
            />
            <BrutalBadge
              label={`${questionsOnly} QUESTIONS`}
              color={theme.brandSecondary || '#FF5722'}
              textColor="#FFFFFF"
            />
          </View>
        </BrutalCard>

        {/* Study Modes */}
        {hasContent ? (
          <View style={styles.modesSection}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              STUDY MODES
            </Text>

            <View style={styles.modeCardsRow}>
              {/* Flashcards Mode */}
              <Pressable
                onPress={() => {
                  soundManager.playButtonClick();
                  navigation.navigate('Study', { set, mode: 'flashcards' });
                }}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    transform: [
                      { translateX: pressed ? 2 : 0 },
                      { translateY: pressed ? 2 : 0 },
                    ],
                  },
                  Platform.OS === 'web' && {
                    boxShadow: pressed
                      ? `1px 1px 0px ${shadowColor}`
                      : `4px 4px 0px ${shadowColor}`,
                    cursor: 'pointer',
                    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                  },
                ]}
              >
                <View
                  style={[
                    styles.modeStripe,
                    { backgroundColor: theme.primary, borderBottomWidth: borderWidth, borderBottomColor: borderColor },
                  ]}
                >
                  <MaterialIcons name="style" size={24} color="#FFFFFF" />
                  <Text style={styles.modeStripeTitle}>FLASHCARDS</Text>
                </View>
                <View style={styles.modeBody}>
                  <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                    Interactive flip cards with tactile self-rating physics.
                  </Text>
                  <Text style={[styles.modeAction, { color: theme.primary }]}>
                    START FLASHCARDS →
                  </Text>
                </View>
              </Pressable>

              {/* Quiz Mode */}
              <Pressable
                onPress={() => {
                  soundManager.playButtonClick();
                  navigation.navigate('Study', { set, mode: 'quiz' });
                }}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    transform: [
                      { translateX: pressed ? 2 : 0 },
                      { translateY: pressed ? 2 : 0 },
                    ],
                  },
                  Platform.OS === 'web' && {
                    boxShadow: pressed
                      ? `1px 1px 0px ${shadowColor}`
                      : `4px 4px 0px ${shadowColor}`,
                    cursor: 'pointer',
                    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                  },
                ]}
              >
                <View
                  style={[
                    styles.modeStripe,
                    {
                      backgroundColor: theme.brandSecondary || '#FF5722',
                      borderBottomWidth: borderWidth,
                      borderBottomColor: borderColor,
                    },
                  ]}
                >
                  <MaterialIcons name="quiz" size={24} color="#FFFFFF" />
                  <Text style={styles.modeStripeTitle}>QUIZ MODE</Text>
                </View>
                <View style={styles.modeBody}>
                  <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                    Multiple choice and True/False questions with live score.
                  </Text>
                  <Text
                    style={[
                      styles.modeAction,
                      { color: theme.brandSecondary || '#FF5722' },
                    ]}
                  >
                    START QUIZ →
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Flashcard Editor Toggle */}
            <BrutalButton
              title={showFlashcardEditor ? 'HIDE ITEM EDITOR' : 'EDIT FLASHCARDS & QUESTIONS'}
              variant="outline"
              icon={
                <MaterialIcons
                  name={showFlashcardEditor ? 'expand-less' : 'edit'}
                  size={18}
                  color={theme.text}
                />
              }
              onPress={() => setShowFlashcardEditor(!showFlashcardEditor)}
              style={{ marginTop: 8, marginBottom: 14 }}
            />

            {showFlashcardEditor && (
              <View style={styles.editorContainer}>
                {set.terms && set.terms.length > 0 && (
                  <View style={{ marginBottom: 18 }}>
                    <View style={styles.editorHeaderRow}>
                      <Text style={[styles.editorSectionTitle, { color: theme.text }]}>
                        TERMS ({set.terms.length})
                      </Text>
                      <BrutalButton
                        title="+ ADD TERM"
                        variant="secondary"
                        onPress={handleAddTerm}
                        style={{ minHeight: 38, paddingVertical: 6, paddingHorizontal: 12 }}
                      />
                    </View>
                    {set.terms.map((term, index) => (
                      <EditableFlashcard
                        key={`term-${index}`}
                        term={term.term}
                        definition={term.definition}
                        index={index}
                        onEdit={handleEditTerm}
                        onDelete={handleDeleteTerm}
                        showAddButton={index === set.terms.length - 1}
                        onAddTerm={handleAddTerm}
                      />
                    ))}
                  </View>
                )}

                {set.questions && set.questions.length > 0 && (
                  <View>
                    <Text style={[styles.editorSectionTitle, { color: theme.text, marginBottom: 10 }]}>
                      QUESTIONS ({set.questions.length})
                    </Text>
                    {set.questions.map((question, index) => (
                      <EditableFlashcard
                        key={`question-${index}`}
                        term={question.question || question.text || 'Question'}
                        definition={question.answer || ''}
                        index={index}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.text }]}>NO ITEMS IN DECK</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Add terms manually or generate questions with AI to start studying.
            </Text>
            <BrutalButton
              title="GENERATE WITH AI"
              variant="primary"
              icon={<MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />}
              onPress={() => navigation.navigate('AIGenerate', { existingSet: set })}
            />
          </View>
        )}

        {/* Deck Utilities & Actions */}
        <View style={styles.utilitiesSection}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>DECK UTILITIES</Text>
          <View style={styles.utilityGrid}>
            {set.terms && set.terms.length > 0 && (
              <BrutalButton
                title={converting ? 'CONVERTING...' : 'AI CONVERT TO QUESTIONS'}
                variant="secondary"
                disabled={converting}
                icon={
                  converting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
                  )
                }
                onPress={handleConvertToQuestions}
              />
            )}
            <BrutalButton
              title="EXPORT AS PDF"
              variant="outline"
              icon={<MaterialIcons name="picture-as-pdf" size={20} color={theme.text} />}
              onPress={() => exportStudySet(set, 'pdf')}
            />
            <BrutalButton
              title="EXPORT AS DOCX"
              variant="outline"
              icon={<MaterialIcons name="description" size={20} color={theme.text} />}
              onPress={() => exportStudySet(set, 'docx')}
            />
            <BrutalButton
              title="DELETE DECK"
              variant="danger"
              icon={<MaterialIcons name="delete" size={20} color="#FFFFFF" />}
              onPress={onDelete}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modesSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modeCardsRow: {
    gap: 14,
    marginBottom: 12,
  },
  modeCard: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  modeStripe: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  modeStripeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  modeBody: {
    padding: 14,
  },
  modeDesc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 10,
  },
  modeAction: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  editorContainer: {
    marginTop: 10,
  },
  editorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editorSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 4,
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  utilitiesSection: {
    marginTop: 14,
  },
  utilityGrid: {
    gap: 10,
  },
});
