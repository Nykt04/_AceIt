import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { generateQuestionsFromTerms } from '../services/aiService';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';
import { showSuccess, showError } from '../services/notificationService';

export default function CreateSetScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const editingSet = route.params?.set;
  const { addStudySet, updateStudySet } = useStudy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [title, setTitle] = useState(editingSet?.title ?? '');
  const [description, setDescription] = useState(editingSet?.description ?? '');
  const [terms, setTerms] = useState(editingSet?.terms ?? [{ term: '', definition: '' }]);
  const [questions, setQuestions] = useState(editingSet?.questions ?? []);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  // Input refs for Enter key navigation
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const termInputRefs = useRef({});

  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 2;

  const addTerm = () => {
    soundManager.playButtonClick();
    setTerms((t) => [...t, { term: '', definition: '' }]);
  };

  const updateTerm = (index, field, value) => {
    setTerms((t) => t.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeTerm = (index) => {
    if (terms.length <= 1) return;
    soundManager.playButtonClick();
    setTerms((t) => t.filter((_, i) => i !== index));
  };

  const handleConvertToQuestions = async () => {
    const validTerms = terms.filter((t) => t.term.trim() && t.definition.trim());

    if (validTerms.length === 0) {
      showError('Please add at least one card with both term and definition');
      return;
    }

    soundManager.playButtonClick();
    setConverting(true);
    try {
      const generated = await generateQuestionsFromTerms(validTerms, validTerms.length);

      if (!generated || generated.length === 0) {
        showError('No questions generated. Try adding more detailed terms.');
        return;
      }

      setQuestions((q) => [...q, ...generated]);
      soundManager.playSuccess();
      showSuccess(`Generated ${generated.length} quiz questions from your cards!`);
    } catch (error) {
      showError(error.message || 'Failed to convert terms to questions');
    } finally {
      setConverting(false);
    }
  };

  const save = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showError('Please enter a title for your study deck');
      return;
    }
    const validTerms = terms.filter((t) => t.term.trim() || t.definition.trim());

    soundManager.playButtonClick();
    setSaving(true);
    try {
      if (editingSet) {
        await updateStudySet(editingSet.id, {
          title: trimmedTitle,
          description: description.trim(),
          terms: validTerms,
          questions,
        });
        soundManager.playSuccess();
        showSuccess(`Deck "${trimmedTitle}" updated successfully`);
        navigation.goBack();
      } else {
        const newSet = await addStudySet({
          title: trimmedTitle,
          description: description.trim(),
          terms: validTerms,
          questions,
        });
        soundManager.playSuccess();
        showSuccess(`Created deck "${trimmedTitle}" with ${validTerms.length} cards`);
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (e) {
      showError(e.message || 'Could not save study set');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* Hero Header */}
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
                  <Text style={styles.heroBadgeText}>DECK STUDIO // MANUAL & AI</Text>
                </View>
                <BrutalBadge
                  label={editingSet ? 'EDITING MODE' : 'NEW WORKSPACE'}
                  color={editingSet ? theme.primary : '#10B981'}
                  textColor="#FFFFFF"
                />
              </View>

              <Text style={[styles.heroTitle, { color: theme.text }]}>
                {editingSet ? 'EDIT STUDY DECK' : 'CREATE NEW STUDY DECK'}
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Design active-recall flashcards, organize definitions, or convert them to automated quiz sets.
              </Text>
            </View>

            {/* 1. Deck Metadata */}
            <BrutalCard
              headerTitle="1. DECK INFORMATION"
              accentColor={theme.primary}
              style={{ marginBottom: 16 }}
            >
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Deck Title:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: '700',
                  },
                  Platform.OS === 'web' && {
                    boxShadow: `2px 2px 0px ${shadowColor}`,
                  },
                ]}
                placeholder="e.g. Organic Chemistry Final, World History Midterm..."
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => descriptionInputRef.current?.focus()}
                ref={titleInputRef}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>
                Description (Optional):
              </Text>
              <TextInput
                style={[
                  styles.textAreaInput,
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
                placeholder="Add study objectives, course number, or notes..."
                placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                ref={descriptionInputRef}
              />
            </BrutalCard>

            {/* 2. Flashcard Terms Section */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleBlock}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>
                  FLASHCARDS & DEFINITIONS
                </Text>
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: theme.accent || '#FCD34D',
                      borderColor: borderColor,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={styles.countPillText}>{terms.length} CARDS</Text>
                </View>
              </View>

              {questions.length > 0 && (
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: theme.primary,
                      borderColor: borderColor,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={[styles.countPillText, { color: '#FFFFFF' }]}>
                    {questions.length} QUESTIONS ATTACHED
                  </Text>
                </View>
              )}
            </View>

            {/* Terms List */}
            {terms.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.cardRowContainer,
                  {
                    backgroundColor: theme.card,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                  },
                  Platform.OS === 'web' && {
                    boxShadow: `3px 3px 0px ${shadowColor}`,
                  },
                ]}
              >
                {/* Card Header Strip */}
                <View
                  style={[
                    styles.cardHeaderStrip,
                    {
                      backgroundColor: theme.isDark ? '#232936' : '#F1F5F9',
                      borderBottomColor: borderColor,
                      borderBottomWidth: borderWidth,
                    },
                  ]}
                >
                  <Text style={[styles.cardIndexLabel, { color: theme.textSecondary }]}>
                    CARD #{index + 1}
                  </Text>
                  {terms.length > 1 && (
                    <Pressable
                      onPress={() => removeTerm(index)}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        {
                          backgroundColor: '#EF4444',
                          borderColor: borderColor,
                          borderWidth: 1.5,
                          transform: [
                            { translateX: pressed ? 1 : 0 },
                            { translateY: pressed ? 1 : 0 },
                          ],
                        },
                        Platform.OS === 'web' && {
                          boxShadow: pressed
                            ? `1px 1px 0px ${shadowColor}`
                            : `2px 2px 0px ${shadowColor}`,
                          cursor: 'pointer',
                        },
                      ]}
                      accessibilityLabel="Delete card"
                    >
                      <MaterialIcons name="delete" size={16} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>

                {/* Term & Definition Inputs */}
                <View style={styles.cardInputBody}>
                  <Text style={[styles.miniInputLabel, { color: theme.textSecondary }]}>
                    TERM / QUESTION:
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        borderColor: borderColor,
                        borderWidth: 1.5,
                        color: theme.text,
                        marginBottom: 10,
                      },
                    ]}
                    placeholder="e.g. Mitochondria"
                    placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                    value={item.term}
                    onChangeText={(v) => updateTerm(index, 'term', v)}
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      const defRef = termInputRefs.current[`${index}-def`];
                      if (defRef) defRef.focus();
                    }}
                    ref={(r) => {
                      termInputRefs.current[index] = r;
                    }}
                  />

                  <Text style={[styles.miniInputLabel, { color: theme.textSecondary }]}>
                    DEFINITION / ANSWER:
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        borderColor: borderColor,
                        borderWidth: 1.5,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. Powerhouse of the cell, generates ATP..."
                    placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                    value={item.definition}
                    onChangeText={(v) => updateTerm(index, 'definition', v)}
                    returnKeyType={index === terms.length - 1 ? 'done' : 'next'}
                    onSubmitEditing={() => {
                      if (index === terms.length - 1) {
                        addTerm();
                      } else {
                        const nextRef = termInputRefs.current[index + 1];
                        if (nextRef) nextRef.focus();
                      }
                    }}
                    ref={(r) => {
                      termInputRefs.current[`${index}-def`] = r;
                    }}
                  />
                </View>
              </View>
            ))}

            {/* Actions for Cards */}
            <View style={styles.cardActionRow}>
              <View style={{ flex: 1 }}>
                <BrutalButton
                  title="+ ADD FLASHCARD"
                  variant="secondary"
                  icon={<MaterialIcons name="add" size={20} color="#FFFFFF" />}
                  onPress={addTerm}
                />
              </View>
              {terms.filter((t) => t.term.trim() && t.definition.trim()).length > 0 && (
                <View style={{ flex: 1.2 }}>
                  <BrutalButton
                    title={converting ? 'CONVERTING...' : 'AI TO QUESTIONS'}
                    variant="accent"
                    icon={<MaterialIcons name="auto-awesome" size={20} color="#111827" />}
                    onPress={handleConvertToQuestions}
                    disabled={converting}
                  />
                </View>
              )}
            </View>

            {/* Final Save Button */}
            <View style={styles.saveSection}>
              <BrutalButton
                title={saving ? 'SAVING DECK...' : 'SAVE STUDY DECK'}
                variant="primary"
                icon={<MaterialIcons name="save" size={22} color="#FFFFFF" />}
                onPress={save}
                disabled={saving}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 8,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  textAreaInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  cardRowContainer: {
    borderRadius: 4,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardIndexLabel: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInputBody: {
    padding: 14,
  },
  miniInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    marginBottom: 6,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  saveSection: {
    marginTop: 10,
  },
});
