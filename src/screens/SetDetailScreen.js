import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { exportStudySet } from '../services/exportService';
import EditableFlashcard from '../components/EditableFlashcard';

export default function SetDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { theme } = useTheme();
    const { studySets, deleteStudySet, updateStudySet } = useStudy();
    const setFromParams = route.params?.set;
    const [showFlashcardEditor, setShowFlashcardEditor] = useState(false);
    const [set, setSet] = useState(null);

    useEffect(() => {
        console.log('[SetDetailScreen] useEffect triggered. studySets length:', studySets.length, 'setFromParams?.id:', setFromParams?.id);
        const currentSet = studySets.find((s) => s.id === setFromParams?.id) || setFromParams;
        console.log('[SetDetailScreen] Found set:', currentSet?.title, 'terms:', currentSet?.terms?.length);
        setSet(currentSet);
    }, [studySets, setFromParams]);

    if (!set) {
        const styles = createStyles(theme);
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 20 }}>
                    <Text style={styles.back}>←Back</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.emptyText}>Set not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const termCount = (set.terms?.length || 0) + (set.questions?.length || 0);
    const hasContent = (set.terms?.length > 0) || (set.questions?.length > 0);

    const onDelete = async () => {
        const proceed = Platform.OS === 'web'
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
        console.log('[SetDetailScreen] Delete term index:', index, 'Total terms:', set?.terms?.length);
        
        if (!set || !set.terms || !set.terms[index]) {
            alert('Error: Could not find term to delete');
            return;
        }
        
        const termToDelete = set.terms[index];
        const termName = termToDelete?.term || 'this term';
        
        // Use browser confirm on web, Alert on native
        const shouldDelete = Platform.OS === 'web' 
            ? window.confirm(`Delete "${termName}"?`)
            : false; // Will use Alert below
        
        if (Platform.OS === 'web') {
            if (shouldDelete) {
                performDelete();
            }
            return;
        }
        
        // Native Alert
        Alert.alert(
            'Delete Term',
            `Delete "${termName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete },
            ]
        );
        
        async function performDelete() {
            try {
                console.log('[SetDetailScreen] Deleting term:', index);
                const updatedTerms = set.terms.filter((_, i) => i !== index);
                console.log('[SetDetailScreen] New terms count:', updatedTerms.length);
                const result = await updateStudySet(set.id, { terms: updatedTerms });
                console.log('[SetDetailScreen] Update result:', result);
                alert('Term deleted successfully!');
            } catch (error) {
                alert('Error: Failed to delete term - ' + error.message);
                console.error('[SetDetailScreen] Delete error:', error);
            }
        }
    };

    const handleEditQuestion = async (index, updatedQuestion) => {
        const updatedQuestions = [...(set.questions || [])];
        updatedQuestions[index] = updatedQuestion;
        await updateStudySet(set.id, { questions: updatedQuestions });
        Alert.alert('Success', 'Question updated!');
    };

    const handleDeleteQuestion = (index) => {
        const proceed = Platform.OS === 'web'
            ? window.confirm('Delete this question?')
            : false;
        
        if (Platform.OS === 'web') {
            if (proceed) {
                performDelete();
            }
            return;
        }
        
        Alert.alert(
            'Delete Question',
            `Delete this question?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete },
            ]
        );
        
        async function performDelete() {
            try {
                const updatedQuestions = set.questions.filter((_, i) => i !== index);
                await updateStudySet(set.id, { questions: updatedQuestions });
                alert('Question deleted successfully!');
            } catch (error) {
                alert('Error: Failed to delete question');
                console.error('Delete error:', error);
            }
        }
    };

    const handleAddTerm = async () => {
        const updatedTerms = [...(set.terms || []), { term: '', definition: '' }];
        await updateStudySet(set.id, { terms: updatedTerms });
    };

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>←Back</Text>
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{set.title}</Text>
                {set.description ? <Text style={styles.desc}>{set.description}</Text> : null}
                <Text style={styles.meta}>{termCount} terms & questions</Text>

                {hasContent ? (
                    <>
                        <View style={styles.modes}>
                            <TouchableOpacity
                                style={styles.modeCard}
                                onPress={() => navigation.navigate('Study', { set, mode: 'flashcards' })}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modeTitle}>Flashcards</Text>
                                    <Text style={styles.modeDesc}>Flip through terms</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modeCard}
                                onPress={() => navigation.navigate('Study', { set, mode: 'quiz' })}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modeTitle}>Quiz</Text>
                                    <Text style={styles.modeDesc}>Multiple choice & True/False</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {(set.terms && set.terms.length > 0) || (set.questions && set.questions.length > 0) ? (
                            <View style={styles.flashcardEditorSection}>
                                <TouchableOpacity
                                    style={[styles.editorToggle, { backgroundColor: showFlashcardEditor ? theme.primaryAccent : theme.secondary }]}
                                    onPress={() => setShowFlashcardEditor(!showFlashcardEditor)}
                                >
                                    <Text style={[styles.editorToggleText, { color: showFlashcardEditor ? '#fff' : theme.text }]}>
                                        {showFlashcardEditor ? 'Close Editor' : 'Edit Flashcards'}
                                    </Text>
                                </TouchableOpacity>

                                {showFlashcardEditor && (
                                    <View style={styles.flashcardEditorContainer}>
                                        {(!set.terms || set.terms.length === 0) && (!set.questions || set.questions.length === 0) && (
                                            <View style={styles.emptyEditorMessage}>
                                                <Text style={[styles.emptyEditorText, { color: theme.textTertiary }]}>No terms or questions yet</Text>
                                                <TouchableOpacity 
                                                    style={[styles.addTermBtn, { backgroundColor: '#10b981', marginTop: 16 }]}
                                                    onPress={handleAddTerm}
                                                >
                                                    <Text style={styles.addTermBtnText}>+ Add First Term</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {set.terms && set.terms.length > 0 && (
                                            <>
                                                <View style={styles.editorHeaderRow}>
                                                    <Text style={[styles.editorTitle, { color: theme.text }]}>Edit Terms</Text>
                                                    <TouchableOpacity 
                                                        style={[styles.addTermBtn, { backgroundColor: '#10b981' }]}
                                                        onPress={handleAddTerm}
                                                    >
                                                        <Text style={styles.addTermBtnText}>+ Add Term</Text>
                                                    </TouchableOpacity>
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
                                            </>
                                        )}
                                        
                                        {set.questions && set.questions.length > 0 && (
                                            <>
                                                <Text style={[styles.sectionDivider, { color: theme.textTertiary, marginTop: set.terms && set.terms.length > 0 ? 24 : 0, marginBottom: 16 }]}>AI Generated Questions</Text>
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
                                            </>
                                        )}
                                    </View>
                                )}
                            </View>
                        ) : null}
                    </>
                ) : (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No terms or questions yet</Text>
                        <Text style={styles.emptyHint}>Edit to add terms, or use AI to generate questions</Text>
                        <TouchableOpacity
                            style={styles.aiBtn}
                            onPress={() => navigation.navigate('AIGenerate', { existingSet: set })}
                        >
                            <Text style={styles.aiBtnText}>Generate with AI</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.exportBtnPDF]} 
                        onPress={() => exportStudySet(set, 'pdf')}
                    >
                        <Text style={styles.actionBtnText}>Export as PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.exportBtnDocx]} 
                        onPress={() => exportStudySet(set, 'docx')}
                    >
                        <Text style={styles.actionBtnText}>Export as DOCX</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                    <Text style={styles.deleteText}>Delete set</Text>
                </TouchableOpacity>
        
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    back: { 
        fontSize: 18, 
        color: theme.textSecondary,
        fontWeight: '600',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    addTermBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        shadowColor: theme.primaryAccent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    addTermBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.primaryAccent,
    },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    title: { 
        fontSize: 28, 
        fontWeight: '800', 
        color: theme.text,
        marginBottom: 8,
    },
    desc: { 
        fontSize: 16, 
        color: theme.textSecondary, 
        marginTop: 8,
        fontWeight: '500',
        lineHeight: 24,
    },
    meta: { 
        fontSize: 14, 
        color: theme.textTertiary, 
        marginTop: 12,
        fontWeight: '600',
    },
    modes: { marginTop: 32 },
    modeCard: {
        backgroundColor: theme.secondary,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: theme.border,
        shadowColor: theme.primaryAccent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    modeTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: theme.text, 
        flex: 1,
    },
    modeDesc: { 
        fontSize: 14, 
        color: theme.textSecondary,
        marginTop: 4,
    },
    empty: { 
        marginTop: 32, 
        alignItems: 'center',
        backgroundColor: theme.secondary,
        borderRadius: 16,
        padding: 32,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.primaryAccent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyText: { 
        fontSize: 18, 
        color: theme.textSecondary,
        fontWeight: '600',
    },
    emptyHint: { 
        fontSize: 15, 
        color: theme.textTertiary, 
        marginTop: 12,
        textAlign: 'center',
    },
    aiBtn: { 
        marginTop: 20, 
        backgroundColor: theme.primaryAccent, 
        paddingVertical: 14, 
        paddingHorizontal: 24, 
        borderRadius: 12,
        shadowColor: theme.primaryAccent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    aiBtnText: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#fff',
        textAlign: 'center',
    },
    actionButtons: {
        marginTop: 24,
        gap: 12,
    },
    actionBtn: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    exportBtnPDF: {
        backgroundColor: theme.primaryAccent,
        borderColor: theme.primaryAccent,
    },
    exportBtnDocx: {
        backgroundColor: theme.primaryAccent,
        borderColor: theme.primaryAccent,
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    deleteBtn: { 
        marginTop: 36, 
        alignItems: 'center',
        paddingVertical: 14,
        backgroundColor: theme.isDark ? theme.secondary : '#fee2e2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.error,
    },
    deleteText: { 
        fontSize: 16, 
        color: theme.error,
        fontWeight: '700',
    },
    flashcardEditorSection: {
        marginTop: 32,
        paddingTop: 20,
        paddingHorizontal: 0,
        paddingBottom: 20,
        borderTopWidth: 1.5,
        borderTopColor: theme.border,
    },
    editorToggle: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: theme.primaryAccent,
        shadowColor: theme.primaryAccent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    editorToggleText: {
        fontSize: 16,
        fontWeight: '700',
    },
    flashcardEditorContainer: {
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    editorTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        color: theme.text,
    },
    emptyEditorMessage: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyEditorText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    sectionDivider: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        color: theme.text,
    },
});