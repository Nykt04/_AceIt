import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStudy } from '../context/StudyContext';
import { Alert } from 'react-native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AnimatedCard = ({ item, index, navigation, onDelete }) => {
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
                                style={styles.card}
                                onPress={() => navigation.navigate('SetDetail', { set: item })}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                activeOpacity={1}
                        >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                        {item.description ? (
                                                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                                        ) : null}
                                        <Text style={styles.cardMeta}>
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
            />
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Navbar onMenuPress={() => setSidebarOpen(true)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <View style={styles.header}>
                <Text style={styles.subtitle}>Your sets</Text>
            </View>
            <FlatList
                data={studySets}
                keyExtractor={(item) => item.id}
                renderItem={renderSet}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No study sets yet</Text>
                        <Text style={styles.emptyHint}>Create one or generate with AI</Text>
                    </View>
                }
            />
            <View style={styles.fabRow}>
                <Animated.View style={{ transform: [{ scale: fabScale1 }] }}>
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => navigation.navigate('AIGenerate')}
                        onPressIn={() => handleFabPressIn(fabScale1)}
                        onPressOut={() => handleFabPressOut(fabScale1)}
                        activeOpacity={1}
                    >
                        <Text style={styles.fabIcon}></Text>
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
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    subtitle: { fontSize: 14, color: '#94a3b8' },
    list: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
    cardDesc: { fontSize: 14, color: '#94a3b8', marginTop: 6 },
    cardMeta: { fontSize: 12, color: '#64748b', marginTop: 8 },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { fontSize: 18, color: '#64748b' },
    emptyHint: { fontSize: 14, color: '#475569', marginTop: 8 },
    fabRow: { position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', justifyContent: 'flex-end' },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        marginLeft: 12,
    },
    fabIcon: { fontSize: 18, color: '#fff', marginRight: 8 },
    fabPrimary: { backgroundColor: '#6366f1' },
    fabLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
    deleteBtn: { padding: 6, marginLeft: 4, borderRadius: 8 },
    deleteText: { fontSize: 18, color: '#f87171' },
});