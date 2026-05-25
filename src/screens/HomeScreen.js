import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Animated, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from 'react-native';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { flexGrow: 1, paddingBottom: 100 },
    
    // Header
    header: { 
        paddingHorizontal: 20, 
        paddingTop: 16, 
        paddingBottom: 24,
    },
    title: { 
        fontSize: 32, 
        fontWeight: '800', 
        color: theme.text,
        marginBottom: 4,
    },
    subtitle: { 
        fontSize: 16, 
        color: theme.textSecondary,
        fontWeight: '500',
    },
    
    // Stats Banner
    statsBanner: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 14,
        padding: 16,
        backgroundColor: theme.background,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '48%',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statCardIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 28,
    },
    statCardContent: {
        flex: 1,
    },
    statCardValue: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.text,
    },
    statCardLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    statCardChange: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '700',
        marginTop: 4,
    },
    
    // Study Sets List
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.text,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
        marginTop: 8,
    },
    sectionHeader: {
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.primaryAccent + '10',
        borderLeftWidth: 4,
        borderLeftColor: theme.primaryAccent,
        borderWidth: 1,
        borderColor: theme.primaryAccent + '30',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionHeaderText: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
    },
    sectionHeaderIcon: {
        fontSize: 24,
    },
    list: { 
        padding: 16, 
        gap: 12,
    },
    card: {
        backgroundColor: theme.secondary,
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: theme.border,
        shadowColor: theme.background,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: theme.text,
        marginBottom: 4,
    },
    cardDesc: { 
        fontSize: 14, 
        color: theme.textSecondary, 
        marginTop: 2,
        fontWeight: '500',
    },
    cardStats: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 16,
        flexWrap: 'wrap',
    },
    cardStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.background + '30',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    cardStatIcon: {
        fontSize: 18,
    },
    cardStatText: {
        fontSize: 15,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: theme.border,
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.primaryAccent,
        borderRadius: 2,
    },
    cardMeta: { 
        fontSize: 14, 
        color: theme.textTertiary, 
        marginTop: 12,
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
        backgroundColor: theme.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: theme.border,
        shadowColor: theme.primaryAccent,
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
        color: theme.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 17,
        color: theme.textTertiary,
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
        backgroundColor: theme.secondary,
        borderRadius: 14,
        padding: 18,
        borderWidth: 1.5,
        borderColor: theme.border,
        alignItems: 'center',
        shadowColor: theme.background,
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
        color: theme.text,
        marginBottom: 6,
    },
    quickActionDesc: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
    },
    
    // Tips Section
    tipsContainer: {
        backgroundColor: theme.secondary,
        borderRadius: 14,
        padding: 18,
        borderWidth: 1.5,
        borderColor: theme.border,
        shadowColor: theme.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
    },
    tipItem: {
        fontSize: 15,
        color: theme.textTertiary,
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
        backgroundColor: theme.textSecondary,
        paddingVertical: 16,
        paddingHorizontal: 22,
        borderRadius: 14,
        marginLeft: 12,
        shadowColor: theme.background,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: theme.textSecondary,
    },
    fabIcon: { 
        fontSize: 20, 
        color: theme.text, 
        marginRight: 10,
    },
    fabPrimary: { 
        backgroundColor: theme.primaryAccent,
        borderColor: theme.primaryLight,
    },
    fabLabel: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: theme.text,
    },
    
    // Delete Button
    deleteBtn: { 
        padding: 8, 
        marginLeft: 8,
        borderRadius: 8,
        backgroundColor: theme.secondary,
    },
    deleteText: { 
        fontSize: 20,
    },
});

const AnimatedCard = ({ item, index, navigation, onDelete, theme, styles }) => {
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

    const termCount = (item.terms?.length || item.flashcards?.length || 0);
    const questionCount = item.questions?.length || 0;
    const totalCount = termCount + questionCount;
    const createdDate = new Date(item.created_at);
    const daysOld = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
    const termPercentage = totalCount > 0 ? Math.round((termCount / totalCount) * 100) : 0;

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
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                                        {item.description ? (
                                                <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={1}>{item.description}</Text>
                                        ) : null}
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={handlePressDelete}
                                    >
                                        <Text style={styles.deleteText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.cardStats}>
                                    <View style={styles.cardStat}>
                                        <Text style={styles.cardStatIcon}>📚</Text>
                                        <Text style={styles.cardStatText}>{totalCount} total</Text>
                                    </View>
                                    {termCount > 0 ? (
                                        <View style={styles.cardStat}>
                                            <Text style={styles.cardStatIcon}>📝</Text>
                                            <Text style={styles.cardStatText}>{termCount} terms</Text>
                                        </View>
                                    ) : null}
                                    {questionCount > 0 ? (
                                        <View style={styles.cardStat}>
                                            <Text style={styles.cardStatIcon}>❓</Text>
                                            <Text style={styles.cardStatText}>{questionCount} Qs</Text>
                                        </View>
                                    ) : null}
                                    <View style={styles.cardStat}>
                                        <Text style={styles.cardStatIcon}>📅</Text>
                                        <Text style={styles.cardStatText}>{daysOld === 0 ? 'Today' : daysOld + ' days ago'}</Text>
                                    </View>
                                </View>

                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${Math.min(100, totalCount * 8)}%` }]} />
                                </View>

                                <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
                                    {totalCount > 0 ? `${termPercentage}% Terms • ${100 - termPercentage}% Questions` : 'Empty'}
                                </Text>
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
    const styles = useMemo(() => createStyles(theme), [theme]);

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
                styles={styles}
            />
        );
    };

    // Calculate statistics
    const calculateStats = () => {
        const totalItems = studySets.reduce((sum, set) => sum + ((set.terms?.length || set.flashcards?.length) || 0) + (set.questions?.length || 0), 0);
        const totalTerms = studySets.reduce((sum, set) => sum + ((set.terms?.length || set.flashcards?.length) || 0), 0);
        const totalQuestions = studySets.reduce((sum, set) => sum + (set.questions?.length || 0), 0);
        
        // Calculate weekly changes (last 7 days)
        const sevenDaysAgo = new Date(new Date() - 7 * 24 * 60 * 60 * 1000);
        const setsThisWeek = studySets.filter(set => new Date(set.created_at) > sevenDaysAgo).length;
        
        const itemsThisWeek = studySets
            .filter(set => new Date(set.created_at) > sevenDaysAgo)
            .reduce((sum, set) => sum + ((set.terms?.length || set.flashcards?.length) || 0) + (set.questions?.length || 0), 0);
        
        const termsThisWeek = studySets
            .filter(set => new Date(set.created_at) > sevenDaysAgo)
            .reduce((sum, set) => sum + ((set.terms?.length || set.flashcards?.length) || 0), 0);
        
        const questionsThisWeek = studySets
            .filter(set => new Date(set.created_at) > sevenDaysAgo)
            .reduce((sum, set) => sum + (set.questions?.length || 0), 0);

        return {
            totalItems,
            totalTerms,
            totalQuestions,
            itemsThisWeek,
            termsThisWeek,
            questionsThisWeek,
            setsThisWeek,
        };
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
                soundManager.playButtonClick();
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

                {studySets.length > 0 && (
                    <View style={styles.statsBanner}>
                        <View style={styles.statsGrid}>
                            {/* Items Card */}
                            <View style={[styles.statCard, { 
                                backgroundColor: theme.secondary,
                                borderColor: '#4A90E2' + '40',
                            }]}>
                                <Text style={{ fontSize: 40 }}>📚</Text>
                                <View style={styles.statCardContent}>
                                    <Text style={[styles.statCardValue, { color: theme.text }]}>
                                        {calculateStats().totalItems}
                                    </Text>
                                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Items</Text>
                                    <Text style={styles.statCardChange}>
                                        +{calculateStats().itemsThisWeek} this week
                                    </Text>
                                </View>
                            </View>

                            {/* Terms Card */}
                            <View style={[styles.statCard, { 
                                backgroundColor: theme.secondary,
                                borderColor: '#F5A623' + '40',
                            }]}>
                                <Text style={{ fontSize: 40 }}>📝</Text>
                                <View style={styles.statCardContent}>
                                    <Text style={[styles.statCardValue, { color: theme.text }]}>
                                        {calculateStats().totalTerms}
                                    </Text>
                                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Terms</Text>
                                    <Text style={styles.statCardChange}>
                                        +{calculateStats().termsThisWeek} this week
                                    </Text>
                                </View>
                            </View>

                            {/* Questions Card */}
                            <View style={[styles.statCard, { 
                                backgroundColor: theme.secondary,
                                borderColor: '#E94B7F' + '40',
                            }]}>
                                <Text style={{ fontSize: 40 }}>❓</Text>
                                <View style={styles.statCardContent}>
                                    <Text style={[styles.statCardValue, { color: theme.text }]}>
                                        {calculateStats().totalQuestions}
                                    </Text>
                                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Questions</Text>
                                    <Text style={styles.statCardChange}>
                                        +{calculateStats().questionsThisWeek} this week
                                    </Text>
                                </View>
                            </View>

                            {/* Sets Card */}
                            <View style={[styles.statCard, { 
                                backgroundColor: theme.secondary,
                                borderColor: '#9B59B6' + '40',
                            }]}>
                                <Text style={{ fontSize: 40 }}>🎯</Text>
                                <View style={styles.statCardContent}>
                                    <Text style={[styles.statCardValue, { color: theme.text }]}>
                                        {studySets.length}
                                    </Text>
                                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Sets</Text>
                                    <Text style={styles.statCardChange}>
                                        +{calculateStats().setsThisWeek} this week
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

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
                                onPress={() => {
                                    soundManager.playButtonClick();
                                    navigation.navigate('CreateSet');
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.quickActionIcon}>✏️</Text>
                                <Text style={[styles.quickActionTitle, { color: theme.text }]}>Create Manually</Text>
                                <Text style={[styles.quickActionDesc, { color: theme.textSecondary }]}>Add terms and definitions</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.quickActionCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                                onPress={() => {
                                    soundManager.playButtonClick();
                                    navigation.navigate('AIGenerate');
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.quickActionTitle, { color: theme.text }]}>AI Generate</Text>
                                <Text style={[styles.quickActionDesc, { color: theme.textSecondary }]}>Create with AI assistance</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.quickActionCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                                onPress={() => {
                                    soundManager.playButtonClick();
                                    navigation.navigate('FileUploadQuestions');
                                }}
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
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeaderIcon}>🔥</Text>
                            <Text style={styles.sectionHeaderText}>Your Study Sets</Text>
                        </View>
                        <View style={styles.list}>
                            {studySets.map((item, index) => renderSet({ item, index }))}
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.fabRow}>
                <Animated.View style={{ transform: [{ scale: fabScale1 }] }}>
                    <TouchableOpacity
                        style={[styles.fab, styles.fabPrimary]}
                        onPress={() => {
                            soundManager.playButtonClick();
                            navigation.navigate('AIGenerate');
                        }}
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
                        onPress={() => {
                            soundManager.playButtonClick();
                            navigation.navigate('CreateSet');
                        }}
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