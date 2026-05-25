import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { generateQuestionsFromTerms } from '../services/aiService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import EditableFlashcard from '../components/EditableFlashcard';

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
  const [showQuestionsEditor, setShowQuestionsEditor] = useState(false);
  const addTermScale = useRef(new Animated.Value(1)).current;
  const saveBtnScale = useRef(new Animated.Value(1)).current;
  const convertBtnScale = useRef(new Animated.Value(1)).current;
  
  // Input refs for Enter key support
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const termInputRefs = useRef({});

  const addTerm = () => {
    Animated.sequence([
      Animated.timing(addTermScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(addTermScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    setTerms((t) => [...t, { term: '', definition: '' }]);
  };

  const updateTerm = (index, field, value) => {
    setTerms((t) => t.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeTerm = (index) => {
    if (terms.length <= 1) return;
    setTerms((t) => t.filter((_, i) => i !== index));
  };

  const handleEditQuestion = (index, updatedQuestion) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = updatedQuestion;
    setQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (index) => {
    setQuestions((q) => q.filter((_, i) => i !== index));
  };

  const handleConvertToQuestions = async () => {
    const validTerms = terms.filter((t) => t.term.trim() && t.definition.trim());
    
    if (validTerms.length === 0) {
      Alert.alert('No terms', 'Add at least one term with both term and definition to convert to questions.');
      return;
    }

    setConverting(true);
    try {
      Animated.sequence([
        Animated.timing(convertBtnScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(convertBtnScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      const generatedQuestions = await generateQuestionsFromTerms(validTerms, validTerms.length);
      
      if (!generatedQuestions || generatedQuestions.length === 0) {
        Alert.alert('No questions generated', 'Try again or add more detailed terms.');
        return;
      }

      // Add generated questions to existing ones
      setQuestions((q) => [...q, ...generatedQuestions]);
      Alert.alert('Success', `Generated ${generatedQuestions.length} questions from your ${validTerms.length} terms! 🎉`);
    } catch (error) {
      console.error('[CreateSet] Convert error:', error);
      Alert.alert('Error', error.message || 'Failed to convert terms to questions');
    } finally {
      setConverting(false);
    }
  };

  const save = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Give your set a title.');
      return;
    }
    const validTerms = terms.filter((t) => t.term.trim() || t.definition.trim());
    
    // Animate save button
    Animated.sequence([
      Animated.timing(saveBtnScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(saveBtnScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSaving(true);
    try {
      if (editingSet) {
        await updateStudySet(editingSet.id, { title: trimmedTitle, description: description.trim(), terms: validTerms, questions });
        navigation.goBack();
      } else {
        const newSet = await addStudySet({ title: trimmedTitle, description: description.trim(), terms: validTerms, questions });
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save set');
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingSet ? 'Edit set' : 'New set'}</Text>
          <Animated.View style={{ transform: [{ scale: saveBtnScale }] }}>
            <TouchableOpacity onPress={save} disabled={saving} activeOpacity={0.8}>
              <Text style={[styles.save, saving && styles.saveDisabled]}>{saving ? '…' : 'Save'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.titleInput}
            placeholder="Set title"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => descriptionInputRef.current?.focus()}
            ref={titleInputRef}
          />
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional)"
            placeholderTextColor={theme.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            returnKeyType="next"
            onSubmitEditing={() => {
              if (termInputRefs.current[0]) {
                termInputRefs.current[0].focus();
              }
            }}
            ref={descriptionInputRef}
          />
          <Text style={styles.sectionTitle}>Terms</Text>
          {terms.map((item, index) => (
            <View key={index} style={styles.termRow}>
              <View style={styles.termInputs}>
                <TextInput
                  style={styles.termInput}
                  placeholder="Term"
                  placeholderTextColor={theme.textTertiary}
                  value={item.term}
                  onChangeText={(v) => updateTerm(index, 'term', v)}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    const definitionRef = termInputRefs.current[`${index}-def`];
                    if (definitionRef) definitionRef.focus();
                  }}
                  ref={(ref) => termInputRefs.current[index] = ref}
                />
                <TextInput
                  style={styles.termInput}
                  placeholder="Definition"
                  placeholderTextColor={theme.textTertiary}
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
                  ref={(ref) => termInputRefs.current[`${index}-def`] = ref}
                />
              </View>
              <TouchableOpacity onPress={() => removeTerm(index)} style={styles.removeBtn}>
                <Text style={styles.removeText}>−</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Animated.View style={{ transform: [{ scale: addTermScale }] }}>
            <TouchableOpacity style={styles.addTerm} onPress={addTerm} activeOpacity={0.8}>
              <Text style={styles.addTermText}>+ Add term</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Convert to Questions Section */}
          {terms.filter((t) => t.term.trim() && t.definition.trim()).length > 0 && (
            <Animated.View style={{ transform: [{ scale: convertBtnScale }], marginTop: 24 }}>
              <TouchableOpacity 
                style={styles.convertBtn} 
                onPress={handleConvertToQuestions} 
                disabled={converting}
                activeOpacity={0.8}
              >
                {converting ? (
                  <ActivityIndicator size="small" color={theme.secondary} />
                ) : (
                  <>
                    <Text style={styles.convertBtnIcon}>✨</Text>
                    <Text style={styles.convertBtnText}>Convert Terms to Questions</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
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
  headerTitle: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: theme.text,
  },
  save: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: theme.primaryAccent,
  },
  saveDisabled: { 
    color: theme.textTertiary,
  },
  scroll: { flex: 1 },
  scrollContent: { 
    padding: 18, 
    paddingBottom: 40,
  },
  titleInput: { 
    backgroundColor: theme.secondary, 
    borderRadius: 14, 
    padding: 16, 
    fontSize: 20, 
    fontWeight: '700',
    color: theme.text, 
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    shadowColor: theme.primaryAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  descInput: { 
    backgroundColor: theme.secondary, 
    borderRadius: 14, 
    padding: 16, 
    fontSize: 16, 
    color: theme.text, 
    minHeight: 100, 
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: theme.border,
    shadowColor: theme.primaryAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: theme.text, 
    marginBottom: 16,
  },
  termRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 16,
    gap: 12,
  },
  termInputs: { 
    flex: 1,
  },
  termInput: { 
    backgroundColor: theme.secondary, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    color: theme.text, 
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: theme.border,
    shadowColor: theme.primaryAccent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  removeBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: theme.error, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: theme.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  removeText: { 
    fontSize: 26, 
    color: '#fff', 
    fontWeight: '700',
  },
  addTerm: { 
    marginTop: 12, 
    paddingVertical: 16, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: theme.primaryAccent, 
    borderRadius: 14, 
    borderStyle: 'dashed',
    backgroundColor: theme.isDark ? theme.secondary : '#f9fafb',
    shadowColor: theme.primaryAccent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addTermText: { 
    fontSize: 17, 
    color: theme.primaryAccent, 
    fontWeight: '700',
  },
  convertBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.primaryAccent,
    flexDirection: 'row',
    gap: 10,
    shadowColor: theme.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  convertBtnIcon: {
    fontSize: 18,
  },
  convertBtnText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '700',
  },
});
