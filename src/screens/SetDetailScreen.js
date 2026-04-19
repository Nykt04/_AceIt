import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';

export default function SetDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { studySets, deleteStudySet, refresh } = useStudy();
    const setFromParams = route.params?.set;
    const set = studySets.find((s) => s.id === setFromParams?.id) || setFromParams;

    if (!set) {
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>←Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CreateSet', { set })}>
                    <Text style={styles.edit}>Edit</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{set.title}</Text>
                {set.description ? <Text style={styles.desc}>{set.description}</Text> : null}
                <Text style={styles.meta}>{termCount} terms & questions</Text>

                {hasContent ? (
                    <View style={styles.modes}>
                        <TouchableOpacity
                            style={styles.modeCard}
                            onPress={() => navigation.navigate('Study', { set, mode: 'flashcards' })}
                        >
                            <Text style={styles.modeIcon}></Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modeTitle}>Flashcards</Text>
                                <Text style={styles.modeDesc}>Flip through terms</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modeCard}
                            onPress={() => navigation.navigate('Study', { set, mode: 'quiz' })}
                        >
                            <Text style={styles.modeIcon}></Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modeTitle}>Quiz</Text>
                                <Text style={styles.modeDesc}>Multiple choice & True/False</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
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

                <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                    <Text style={styles.deleteText}>Delete set</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    back: { fontSize: 16, color: '#94a3b8' },
    edit: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
    desc: { fontSize: 15, color: '#94a3b8', marginTop: 8 },
    meta: { fontSize: 13, color: '#64748b', marginTop: 6 },
    modes: { marginTop: 28 },
    modeCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    modeIcon: { fontSize: 32, marginRight: 16 },
    modeTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', flex: 1 },
    modeDesc: { fontSize: 13, color: '#94a3b8' },
    empty: { marginTop: 28, alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#64748b' },
    emptyHint: { fontSize: 14, color: '#475569', marginTop: 8 },
    aiBtn: { marginTop: 16, backgroundColor: '#6366f1', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
    aiBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    deleteBtn: { marginTop: 32, alignItems: 'center' },
    deleteText: { fontSize: 15, color: '#f87171' },
});