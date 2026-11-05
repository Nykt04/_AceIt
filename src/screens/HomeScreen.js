import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalSkeleton, BrutalBadge } from '../components/brutal';

const createStyles = (theme) => {
  const borderColor = theme.border || '#121212';
  const shadowColor = theme.shadow || '#121212';
  const borderWidth = theme.borderWidth || 3;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 110,
    },

    // Header Hero Banner
    heroBanner: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 16,
      padding: 20,
      borderRadius: 4,
      backgroundColor: theme.primary,
      borderWidth: borderWidth,
      borderColor: borderColor,
      ...(Platform.OS === 'web' && {
        boxShadow: `4px 4px 0px ${shadowColor}`,
      }),
    },
    heroBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.accent || '#FFDE59',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 3,
      borderWidth: 2,
      borderColor: '#121212',
      marginBottom: 10,
    },
    heroBadgeText: {
      fontSize: 11,
      fontWeight: '900',
      color: '#121212',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 14,
      color: '#F4F4F4',
      fontWeight: '700',
      lineHeight: 20,
    },

    // Stats Grid
    statsBanner: {
      marginHorizontal: 16,
      marginBottom: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '47%',
      borderRadius: 4,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: borderWidth,
      borderColor: borderColor,
      backgroundColor: theme.card,
      ...(Platform.OS === 'web' && {
        boxShadow: `3px 3px 0px ${shadowColor}`,
      }),
    },
    statCardContent: {
      flex: 1,
    },
    statCardValue: {
      fontSize: 24,
      fontWeight: '900',
      color: theme.text,
    },
    statCardLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    statCardChange: {
      fontSize: 11,
      color: theme.success || '#10B981',
      fontWeight: '800',
      marginTop: 4,
    },

    // Study Sets Section
    sectionHeader: {
      marginHorizontal: 16,
      marginBottom: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 4,
      backgroundColor: theme.card,
      borderWidth: borderWidth,
      borderColor: borderColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...(Platform.OS === 'web' && {
        boxShadow: `3px 3px 0px ${shadowColor}`,
      }),
    },
    sectionHeaderText: {
      fontSize: 15,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    list: {
      paddingHorizontal: 16,
      gap: 14,
    },

    // Set Card
    card: {
      backgroundColor: theme.card,
      borderRadius: 4,
      padding: 16,
      marginBottom: 14,
      borderWidth: borderWidth,
      borderColor: borderColor,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    cardDesc: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
      lineHeight: 18,
    },
    cardStats: {
      flexDirection: 'row',
      marginTop: 10,
      gap: 8,
      flexWrap: 'wrap',
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.muted,
      borderRadius: 2,
      borderWidth: 2,
      borderColor: borderColor,
      marginTop: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
    },
    cardMeta: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Delete Button
    deleteBtn: {
      padding: 8,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: borderColor,
      backgroundColor: theme.isDark ? '#3E1E1E' : '#FFEBEB',
    },

    // Empty State
    emptyContainer: {
      paddingHorizontal: 20,
      paddingVertical: 32,
      marginHorizontal: 16,
      borderRadius: 4,
      backgroundColor: theme.card,
      borderWidth: borderWidth,
      borderColor: borderColor,
      alignItems: 'center',
      ...(Platform.OS === 'web' && {
        boxShadow: `4px 4px 0px ${shadowColor}`,
      }),
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.text,
      textAlign: 'center',
      marginTop: 14,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
      fontWeight: '600',
    },
    emptyActions: {
      width: '100%',
      gap: 12,
    },

    // Floating Action Buttons
    fabRow: {
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      zIndex: 20,
    },
  });
};

const AnimatedCard = ({ item, index, navigation, onDelete, theme, styles }) => {
  const [isDown, setIsDown] = useState(false);
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        delay: Math.min(index * 40, 200),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        delay: Math.min(index * 40, 200),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, slideAnim, index]);

  const handlePressDelete = async () => {
    soundManager.playButtonClick();
    const proceed =
      Platform.OS === 'web'
        ? window.confirm(`Delete "${item.title}"? This action cannot be undone.`)
        : await new Promise((res) => {
            Alert.alert(
              'Delete Set',
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

  const termCount = item.terms?.length || item.flashcards?.length || 0;
  const questionCount = item.questions?.length || 0;
  const totalCount = termCount + questionCount;
  const createdDate = new Date(item.created_at);
  const daysOld = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
  const termPercentage = totalCount > 0 ? Math.round((termCount / totalCount) * 100) : 0;

  const shadowColor = theme.shadow || '#121212';
  const currentOffset = isDown ? 1 : 4;

  const webShadow = Platform.OS === 'web'
    ? {
        boxShadow: `${currentOffset}px ${currentOffset}px 0px ${shadowColor}`,
        cursor: 'pointer',
        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
      }
    : {
        shadowColor: shadowColor,
        shadowOffset: { width: currentOffset, height: currentOffset },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: currentOffset,
      };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Pressable
        onPress={() => {
          soundManager.playButtonClick();
          navigation.navigate('SetDetail', { set: item });
        }}
        onPressIn={() => setIsDown(true)}
        onPressOut={() => setIsDown(false)}
        style={[
          styles.card,
          {
            transform: [
              { translateX: isDown ? 2 : 0 },
              { translateY: isDown ? 2 : 0 },
            ],
          },
          webShadow,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handlePressDelete}
            accessibilityLabel={`Delete ${item.title}`}
          >
            <MaterialIcons name="delete" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardStats}>
          <BrutalBadge
            label={`${totalCount} TOTAL`}
            color={theme.primary}
            textColor="#FFFFFF"
          />
          {termCount > 0 && (
            <BrutalBadge
              label={`${termCount} TERMS`}
              color={theme.accent || '#FFDE59'}
              textColor="#121212"
            />
          )}
          {questionCount > 0 && (
            <BrutalBadge
              label={`${questionCount} QUESTIONS`}
              color={theme.brandSecondary || '#FF5722'}
              textColor="#FFFFFF"
            />
          )}
          <BrutalBadge
            label={daysOld === 0 ? 'TODAY' : `${daysOld}D AGO`}
            color={theme.muted}
            textColor={theme.text}
          />
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(10, totalCount * 12))}%` },
            ]}
          />
        </View>

        <Text style={styles.cardMeta}>
          {totalCount > 0
            ? `${termPercentage}% TERMS • ${100 - termPercentage}% QUESTIONS`
            : 'EMPTY SET'}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const { studySets, loading, refresh, deleteStudySet } = useStudy();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation, refresh]);

  const handleDelete = async (id) => {
    const ok = await deleteStudySet(id);
    if (!ok) {
      Alert.alert('Error', 'Failed to delete set. Please try again.');
    }
  };

  const calculateStats = () => {
    const totalItems = studySets.reduce(
      (sum, set) =>
        sum +
        (set.terms?.length || set.flashcards?.length || 0) +
        (set.questions?.length || 0),
      0
    );
    const totalTerms = studySets.reduce(
      (sum, set) => sum + (set.terms?.length || set.flashcards?.length || 0),
      0
    );
    const totalQuestions = studySets.reduce(
      (sum, set) => sum + (set.questions?.length || 0),
      0
    );

    const sevenDaysAgo = new Date(new Date() - 7 * 24 * 60 * 60 * 1000);
    const itemsThisWeek = studySets
      .filter((set) => new Date(set.created_at) > sevenDaysAgo)
      .reduce(
        (sum, set) =>
          sum +
          (set.terms?.length || set.flashcards?.length || 0) +
          (set.questions?.length || 0),
        0
      );

    return {
      totalItems,
      totalTerms,
      totalQuestions,
      itemsThisWeek,
      totalSets: studySets.length,
    };
  };

  // Structured Skeleton Loader when fetching
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar onMenuPress={() => setSidebarOpen(true)} />
        <View style={{ padding: 16 }}>
          <BrutalSkeleton height={110} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <BrutalSkeleton height={80} style={{ flex: 1 }} />
            <BrutalSkeleton height={80} style={{ flex: 1 }} />
          </View>
          <BrutalSkeleton height={140} style={{ marginBottom: 12 }} />
          <BrutalSkeleton height={140} style={{ marginBottom: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = calculateStats();

  return (
    <SafeAreaView style={styles.container}>
      <Navbar
        onMenuPress={() => {
          soundManager.playButtonClick();
          setSidebarOpen(true);
        }}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Neubrutalism Hero Header */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>ACTIVE DASHBOARD</Text>
          </View>
          <Text style={styles.heroTitle}>STUDY DECKS</Text>
          <Text style={styles.heroSubtitle}>
            High-contrast flashcard study system. Master your sets with tactile reviews.
          </Text>
        </View>

        {/* Stats Grid */}
        {studySets.length > 0 && (
          <View style={styles.statsBanner}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons name="menu-book" size={32} color={theme.primary} />
                <View style={styles.statCardContent}>
                  <Text style={styles.statCardValue}>{stats.totalItems}</Text>
                  <Text style={styles.statCardLabel}>Total Items</Text>
                  <Text style={styles.statCardChange}>+{stats.itemsThisWeek} this week</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons
                  name="assignment"
                  size={32}
                  color={theme.accent || '#FFDE59'}
                />
                <View style={styles.statCardContent}>
                  <Text style={styles.statCardValue}>{stats.totalTerms}</Text>
                  <Text style={styles.statCardLabel}>Terms</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons
                  name="help"
                  size={32}
                  color={theme.brandSecondary || '#FF5722'}
                />
                <View style={styles.statCardContent}>
                  <Text style={styles.statCardValue}>{stats.totalQuestions}</Text>
                  <Text style={styles.statCardLabel}>Questions</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="folder" size={32} color={theme.textSecondary} />
                <View style={styles.statCardContent}>
                  <Text style={styles.statCardValue}>{stats.totalSets}</Text>
                  <Text style={styles.statCardLabel}>Sets</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Study Sets List or Empty State */}
        {studySets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="library-books"
              size={54}
              color={theme.textTertiary}
            />
            <Text style={styles.emptyTitle}>NO STUDY SETS YET</Text>
            <Text style={styles.emptyDescription}>
              Create your first deck manually or generate one instantly using our AI assistant.
            </Text>
            <View style={styles.emptyActions}>
              <BrutalButton
                title="CREATE SET MANUALLY"
                variant="primary"
                icon={<MaterialIcons name="add" size={20} color="#FFFFFF" />}
                onPress={() => {
                  soundManager.playButtonClick();
                  navigation.navigate('CreateSet');
                }}
              />
              <BrutalButton
                title="AI GENERATE SET"
                variant="secondary"
                icon={<MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />}
                onPress={() => {
                  soundManager.playButtonClick();
                  navigation.navigate('AIGenerate');
                }}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>YOUR DECKS ({studySets.length})</Text>
              <MaterialIcons name="bolt" size={22} color={theme.accent || '#FFDE59'} />
            </View>
            <View style={styles.list}>
              {studySets.map((item, index) => {
                const setItem = { ...item, id: String(item.id) };
                return (
                  <AnimatedCard
                    key={setItem.id}
                    item={setItem}
                    index={index}
                    navigation={{
                      ...navigation,
                      navigate: (screen, params) => {
                        const latestSet =
                          studySets.find((s) => String(s.id) === String(item.id)) ||
                          setItem;
                        navigation.navigate(screen, { ...params, set: latestSet });
                      },
                    }}
                    onDelete={handleDelete}
                    theme={theme}
                    styles={styles}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabRow}>
        <BrutalButton
          title="AI GENERATE"
          variant="secondary"
          icon={<MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />}
          onPress={() => {
            soundManager.playButtonClick();
            navigation.navigate('AIGenerate');
          }}
        />
        <BrutalButton
          title="NEW SET"
          variant="primary"
          icon={<MaterialIcons name="add" size={22} color="#FFFFFF" />}
          onPress={() => {
            soundManager.playButtonClick();
            navigation.navigate('CreateSet');
          }}
        />
      </View>
    </SafeAreaView>
  );
}
