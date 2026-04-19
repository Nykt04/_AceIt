import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function CreateSetScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editingSet = route.params?.set;
  const { addStudySet, updateStudySet } = useStudy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [title, setTitle] = useState(editingSet?.title ?? '');
  const [description, setDescription] = useState(editingSet?.description ?? '');
  const [terms, setTerms] = useState(editingSet?.terms ?? [{ term: '', definition: '' }]);
  const [saving, setSaving] = useState(false);
  const addTermScale = useRef(new Animated.Value(1)).current;
  const saveBtnScale = useRef(new Animated.Value(1)).current;

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
        await updateStudySet(editingSet.id, { title: trimmedTitle, description: description.trim(), terms: validTerms });
        navigation.goBack();
      } else {
        const newSet = await addStudySet({ title: trimmedTitle, description: description.trim(), terms: validTerms, questions: [] });
        navigation.replace('SetDetail', { set: newSet });
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save set');
    } finally {
      setSaving(false);
    }
  };

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
            placeholderTextColor="#64748b"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional)"
            placeholderTextColor="#64748b"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Text style={styles.sectionTitle}>Terms</Text>
          {terms.map((item, index) => (
            <View key={index} style={styles.termRow}>
              <View style={styles.termInputs}>
                <TextInput
                  style={styles.termInput}
                  placeholder="Term"
                  placeholderTextColor="#64748b"
                  value={item.term}
                  onChangeText={(v) => updateTerm(index, 'term', v)}
                />
                <TextInput
                  style={styles.termInput}
                  placeholder="Definition"
                  placeholderTextColor="#64748b"
                  value={item.definition}
                  onChangeText={(v) => updateTerm(index, 'definition', v)}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  cancel: { fontSize: 16, color: '#94a3b8' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#f8fafc' },
  save: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  saveDisabled: { color: '#64748b' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  titleInput: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, fontSize: 18, color: '#f8fafc', marginBottom: 12 },
  descInput: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, fontSize: 15, color: '#f8fafc', minHeight: 80, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 },
  termRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  termInputs: { flex: 1 },
  termInput: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, fontSize: 15, color: '#f8fafc', marginBottom: 8 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 20, color: '#f87171', fontWeight: '600' },
  addTerm: { marginTop: 8, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#334155', borderRadius: 12, borderStyle: 'dashed' },
  addTermText: { fontSize: 15, color: '#94a3b8', fontWeight: '500' },
});
