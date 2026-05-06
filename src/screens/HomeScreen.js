import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Animated, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from 'react-native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AnimatedCard = ({ item, index, navigation, onDelete, theme }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressDelete = async () => {
        console.log('[AnimatedCard] delete pressed for', item.id);
        const proceed = Platform.OS === 'web'
            ? window.confirm(`Delete "${item.title}"? This action cannot be undone.`)
            : await new Promise((res) => {
                  Alert.alert(
                      'Delete set',
                      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
                      [
                          { text: 'Cancel', style: 'cancel', onPress: () => res(false) },
                          { text: 'Delete', style: 'destructive', onPress: () => res(true) },
                      ]
                  );
              });
        if (!proceed) return;
        await onDelete(item.id);
    };

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 50,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, index]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const termCount = (item.terms?.length || 0) + (item.questions?.length || 0);

        return (
                <Animated.View style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                }}>
                        <TouchableOpacity
                                style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                                onPress={() => navigation.navigate('SetDetail', { set: item })}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                activeOpacity={1}
                        >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                                        {item.description ? (
                                                <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                                        ) : null}
                                        <Text style={[styles.cardMeta, { color: theme.textTertiary }]}>
                                                {termCount} terms · {item.questions?.length || 0} quiz questions
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={handlePressDelete}
                                    >
                                        <Text style={styles.deleteText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                        </TouchableOpacity>
                </Animated.View>
        );
};

export default function HomeScreen() {
    const navigation = useNavigation();
    const { studySets, loading, refresh, deleteStudySet } = useStudy();
    const { theme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const fabScale1 = useRef(new Animated.Value(1)).current;
    const fabScale2 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        console.log('[HomeScreen] studySets updated', studySets.map((s) => s.id));
    }, [studySets]);

    // delete returns a boolean; state is already updated by context
    const handleDelete = async (id) => {
        console.log('[HomeScreen] handleDelete', id);
        const ok = await deleteStudySet(id);
        console.log('[HomeScreen] deleteStudySet returned', ok);
        if (!ok) {
            Alert.alert('Error', 'Failed to delete set. Please try again.');
        }
    };

    useEffect(() => {
        const unsub = navigation.addListener('focus', refresh);
        return unsub;
    }, [navigation, refresh]);

    useEffect(() => {
        // Animate FABs on mount
        Animated.parallel([
            Animated.spring(fabScale1, {
                toValue: 1,
                friction: 3,
                tension: 40,
                delay: 0,
                useNativeDriver: true,
            }),
            Animated.spring(fabScale2, {
                toValue: 1,
                friction: 3,
                tension: 40,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fabScale1, fabScale2]);

    const handleFabPressIn = (anim) => {
        Animated.spring(anim, {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };

    const handleFabPressOut = (anim) => {
        Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const renderSet = ({ item, index }) => {
        // Always use string IDs
        const setItem = { ...item, id: String(item.id) };
        return (
            <AnimatedCard
                item={setItem}
                index={index}
                navigation={{
                    ...navigation,
                    navigate: (screen, params) => {
                        // Always pass the latest set object from context
                        const latestSet = studySets.find((s) => String(s.id) === String(item.id)) || setItem;
                        navigation.navigate(screen, { ...params, set: latestSet });
                    },
                }}
                onDelete={handleDelete}
                theme={theme}
            />
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primaryAccent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Navbar onMenuPress={() => {
                console.log('[HomeScreen] Menu button clicked, opening sidebar');
                setSidebarOpen(true);
            }} />
            <Sidebar isOpen={sidebarOpen} onClose={() => {
                console.log('[HomeScreen] Sidebar closed');
                setSidebarOpen(false);
            }} />
            
            <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={true}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>📚 My Study Sets</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{studySets.length} set{studySets.length !== 1 ? 's' : ''}</Text>
                </View>

                {studySets.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIllustration}>
                            <Text style={styles.emptyIcon}>📖</Text>
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Study Sets Yet</Text>
                        <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                            Start your learning journey by creating your first study set or generating one with AI!
                        </Text>
                        
                        <View style={styles.quickActionsContainer}>
                            <TouchableOpacity 
                                style={[styles.quickActionCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                                onPress={() => navigation.navigate('CreateSet')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.quickActionIcon}>✏️</Text>
                                <Text style={[styles.quickActionTitle, { color: theme.text }]}>Create Manually</Text>
                                <Text style={[styles.quickActionDesc, { color: theme.textSecondary }]}>Add terms and definitions</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.quickActionCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                                onPress={() => navigation.navigate('AIGenerate')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.quickActionIcon}>✨</Text>
                                <Text style={[styles.quickActionTitle, { color: theme.text }]}>AI Generate</Text>
                                <Text style={[styles.quickActionDesc, { color: theme.textSecondary }]}>Create with AI assistance</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.quickActionCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                                onPress={() => navigation.navigate('FileUploadQuestions')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.quickActionIcon}>📄</Text>
                                <Text style={[styles.quickActionTitle, { color: theme.text }]}>Upload File</Text>
                                <Text style={[styles.quickActionDesc, { color: theme.textSecondary }]}>Extract from DOCX/TXT</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tipsContainer}>
                            <Text style={styles.tipsTitle}>💡 Tips to Get Started:</Text>
                            <Text style={styles.tipItem}>• Create a set with key terms you want to learn</Text>
                            <Text style={styles.tipItem}>• Use AI to generate questions from your notes</Text>
                            <Text style={styles.tipItem}>• Test yourself with interactive quizzes</Text>
                            <Text style={styles.tipItem}>• Track your progress over time</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {studySets.map((item, index) => renderSet({ item, index }))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.fabRow}>
                <Animated.View style={{ transform: [{ scale: fabScale1 }] }}>
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => navigation.navigate('AIGenerate')}
                        onPressIn={() => handleFabPressIn(fabScale1)}
                        onPressOut={() => handleFabPressOut(fabScale1)}
                        activeOpacity={1}
                    >
                        <Text style={styles.fabIcon}>✨</Text>
                        <Text style={styles.fabLabel}>AI Generate</Text>
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: fabScale2 }] }}>
                    <TouchableOpacity
                        style={[styles.fab, styles.fabPrimary]}
                        onPress={() => navigation.navigate('CreateSet')}
                        onPressIn={() => handleFabPressIn(fabScale2)}
                        onPressOut={() => handleFabPressOut(fabScale2)}
                        activeOpacity={1}
                    >
                        <Text style={styles.fabIcon}>+</Text>
                        <Text style={styles.fabLabel}>New Set</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { flexGrow: 1, paddingBottom: 100 },
    
    // Header
    header: { 
        paddingHorizontal: 20, 
        paddingTop: 20, 
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    title: { 
        fontSize: 32, 
        fontWeight: '800', 
        color: '#f8fafc',
        marginBottom: 4,
    },
    subtitle: { 
        fontSize: 16, 
        color: '#94a3b8',
        fontWeight: '500',
    },
    
    // Study Sets List
    list: { 
        padding: 16, 
        gap: 12,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    cardTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: '#f8fafc',
    },
    cardDesc: { 
        fontSize: 15, 
        color: '#cbd5e1', 
        marginTop: 8,
        fontWeight: '500',
    },
    cardMeta: { 
        fontSize: 14, 
        color: '#94a3b8', 
        marginTop: 10,
        fontWeight: '500',
    },
    
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    emptyIllustration: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#334155',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    emptyIcon: {
        fontSize: 64,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#f8fafc',
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 17,
        color: '#cbd5e1',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 26,
    },
    
    // Quick Actions
    quickActionsContainer: {
        width: '100%',
        marginBottom: 32,
        gap: 12,
    },
    quickActionCard: {
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#334155',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    quickActionIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    quickActionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: 6,
    },
    quickActionDesc: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    
    // Tips Section
    tipsContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: 12,
    },
    tipItem: {
        fontSize: 15,
        color: '#cbd5e1',
        marginBottom: 8,
        lineHeight: 22,
    },
    
    // FAB
    fabRow: { 
        position: 'absolute', 
        bottom: 24, 
        left: 16, 
        right: 16, 
        flexDirection: 'row', 
        justifyContent: 'flex-end',
        gap: 12,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        paddingVertical: 16,
        paddingHorizontal: 22,
        borderRadius: 14,
        marginLeft: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#475569',
    },
    fabIcon: { 
        fontSize: 20, 
        color: '#fff', 
        marginRight: 10,
    },
    fabPrimary: { 
        backgroundColor: '#6366f1',
        borderColor: '#818cf8',
    },
    fabLabel: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#fff',
    },
    
    // Delete Button
    deleteBtn: { 
        padding: 8, 
        marginLeft: 8,
        borderRadius: 8,
        backgroundColor: '#1e293b',
    },
    deleteText: { 
        fontSize: 20,
    },
});