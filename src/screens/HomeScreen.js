import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import soundManager from '../services/soundService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BrutalCard, BrutalButton, BrutalSkeleton, BrutalBadge, DashboardSkeleton } from '../components/brutal';
import { showNotification, showError, NotificationType } from '../services/notificationService';

// Physical Deck Stack Card Component with 3D Layer Spread and Tactile Spring Physics
const PhysicalDeckCard = ({ item, index, navigation, onDelete, theme, cardWidth }) => {
  const [isHovered, setIsHovered] = useState(false);
  const slideAnim = useRef(new Animated.Value(28)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index * 45, 300);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 85,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 85,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [index, opacityAnim, scaleAnim, slideAnim]);

  const termCount = item.terms?.length || item.flashcards?.length || 0;
  const questionCount = item.questions?.length || 0;
  const totalCount = termCount + questionCount;

  const daysOld = Math.floor(
    (new Date() - new Date(item.created_at || Date.now())) / (1000 * 60 * 60 * 24)
  );

  const handlePressDelete = () => {
    soundManager.playButtonClick();
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Permanently delete deck "${item.title}"?`);
      if (ok) onDelete(item.id);
    } else {
      Alert.alert(
        'Delete Deck',
        `Are you sure you want to delete "${item.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(item.id),
          },
        ]
      );
    }
  };

  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  // Deck badge logic
  let badgeLabel = 'EMPTY';
  let badgeColor = theme.muted;
  let badgeTextColor = theme.text;

  if (termCount > 0 && questionCount > 0) {
    badgeLabel = 'MIXED DECK';
    badgeColor = theme.accent || '#FCD34D';
    badgeTextColor = '#111827';
  } else if (termCount > 0) {
    badgeLabel = `${termCount} TERMS`;
    badgeColor = theme.primary;
    badgeTextColor = '#FFFFFF';
  } else if (questionCount > 0) {
    badgeLabel = `${questionCount} QUESTIONS`;
    badgeColor = theme.brandSecondary || '#EA580C';
    badgeTextColor = '#FFFFFF';
  }

  const progressPercent = Math.min(100, Math.max(12, totalCount * 10));

  return (
    <Animated.View
      style={[
        styles.deckWrapper,
        {
          width: cardWidth,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* 3D Stack Layer 2 (Fans out on hover) */}
      <View
        style={[
          styles.stackLayer2,
          {
            top: isHovered ? 9 : 6,
            left: isHovered ? 9 : 6,
            right: isHovered ? -9 : -6,
            bottom: isHovered ? -9 : -6,
            backgroundColor: theme.muted,
            borderColor: borderColor,
            borderWidth: borderWidth,
            ...(Platform.OS === 'web' && {
              transition: 'all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }),
          },
        ]}
      />
      {/* 3D Stack Layer 1 (Fans out on hover) */}
      <View
        style={[
          styles.stackLayer1,
          {
            top: isHovered ? 5 : 3,
            left: isHovered ? 5 : 3,
            right: isHovered ? -5 : -3,
            bottom: isHovered ? -5 : -3,
            backgroundColor: theme.card,
            borderColor: borderColor,
            borderWidth: borderWidth,
            ...(Platform.OS === 'web' && {
              transition: 'all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }),
          },
        ]}
      />

      {/* Main Front Deck Card */}
      <Pressable
        onPress={() => {
          soundManager.playButtonClick();
          navigation.navigate('SetDetail', { set: item });
        }}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={({ pressed, hovered }) => {
          const isDown = pressed;
          const isHover = hovered && !isDown;
          const curShadow = isDown ? 1 : isHover ? 6 : 3;
          const trans = isDown ? 2 : isHover ? -3 : 0;

          return [
            styles.mainDeckCard,
            {
              backgroundColor: theme.card,
              borderColor: borderColor,
              borderWidth: borderWidth,
              transform: [{ translateX: trans }, { translateY: trans }],
            },
            Platform.OS === 'web' && {
              boxShadow: `${curShadow}px ${curShadow}px 0px ${shadowColor}`,
              cursor: 'pointer',
              transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
          ];
        }}
      >
        {/* Top Header: Badge + Delete Icon */}
        <View style={styles.cardHeaderRow}>
          <BrutalBadge
            label={badgeLabel}
            color={badgeColor}
            textColor={badgeTextColor}
          />
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              {
                borderColor: borderColor,
                backgroundColor: theme.isDark ? '#3E1F1F' : '#FEE2E2',
              },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              handlePressDelete();
            }}
            accessibilityLabel={`Delete deck ${item.title}`}
          >
            <MaterialIcons name="delete-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Deck Title & Description */}
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.cardDesc, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.description ? item.description : 'No description provided for this deck.'}
          </Text>
        </View>

        {/* Deck Thickness / Card Count & Age */}
        <View style={styles.cardMetaRow}>
          <View
            style={[
              styles.thicknessBadge,
              {
                backgroundColor: theme.muted,
                borderColor: borderColor,
                borderWidth: 1.5,
              },
            ]}
          >
            <MaterialIcons name="layers" size={14} color={theme.text} />
            <Text style={[styles.thicknessText, { color: theme.text }]}>
              {totalCount} {totalCount === 1 ? 'ITEM' : 'ITEMS'}
            </Text>
          </View>
          <Text style={[styles.ageText, { color: theme.textTertiary }]}>
            {daysOld === 0 ? 'TODAY' : `${daysOld}D AGO`}
          </Text>
        </View>

        {/* Mastery Progress Bar */}
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: theme.muted,
              borderColor: borderColor,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>

        {/* Action Button: Study Deck with Hover Lift */}
        <View
          style={[
            styles.studyButton,
            {
              backgroundColor: theme.primary,
              borderColor: borderColor,
              borderWidth: borderWidth,
            },
            Platform.OS === 'web' && {
              boxShadow: `2px 2px 0px ${shadowColor}`,
            },
          ]}
        >
          <Text style={styles.studyButtonText}>STUDY DECK</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const { studySets, loading, refresh, deleteStudySet } = useStudy();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'TERMS' | 'QUESTIONS' | 'RECENT'

  // Staggered Entry Animation Hooks
  const heroAnim = useRef(new Animated.Value(-24)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(20)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const toolbarAnim = useRef(new Animated.Value(14)).current;
  const toolbarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(60, [
      Animated.parallel([
        Animated.spring(heroAnim, {
          toValue: 0,
          friction: 7,
          tension: 90,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
      Animated.parallel([
        Animated.spring(statsAnim, {
          toValue: 0,
          friction: 7,
          tension: 85,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
      Animated.parallel([
        Animated.spring(toolbarAnim, {
          toValue: 0,
          friction: 7,
          tension: 85,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(toolbarOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    ]).start();
  }, [heroAnim, heroOpacity, statsAnim, statsOpacity, toolbarAnim, toolbarOpacity]);

  const { width } = useWindowDimensions();

  // Responsive column calculation constrained to 1200px container
  const cardWidth = useMemo(() => {
    const containerWidth = Math.min(width, 1200) - 32;
    const gap = 16;
    if (containerWidth >= 960) {
      // 3 clean columns on desktop
      const available = containerWidth - gap * 2;
      return Math.floor(available / 3);
    } else if (containerWidth >= 600) {
      // 2 columns on tablet / split view
      const available = containerWidth - gap;
      return Math.floor(available / 2);
    } else {
      // 1 column on mobile
      return containerWidth;
    }
  }, [width]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation, refresh]);

  const handleDelete = async (id) => {
    const targetSet = studySets.find((s) => String(s.id) === String(id));
    const title = targetSet?.title || 'Study deck';
    const ok = await deleteStudySet(id);
    if (ok) {
      showNotification('DECK REMOVED', `"${title}" was permanently deleted.`, NotificationType.ERROR);
    } else {
      showError('DELETE FAILED', 'Failed to delete set. Please try again.');
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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const itemsThisWeek = studySets
      .filter((set) => new Date(set.created_at) > sevenDaysAgo)
      .reduce(
        (sum, set) =>
          sum +
          (set.terms?.length || set.flashcards?.length || 0) +
          (set.questions?.length || 0),
        0
      );

    return { totalItems, totalTerms, totalQuestions, totalSets: studySets.length, itemsThisWeek };
  };

  // Filtered study sets based on search & category pill
  const filteredSets = useMemo(() => {
    let result = [...studySets];

    // Category filter
    if (activeFilter === 'TERMS') {
      result = result.filter(
        (s) => (s.terms?.length || s.flashcards?.length || 0) > 0
      );
    } else if (activeFilter === 'QUESTIONS') {
      result = result.filter((s) => (s.questions?.length || 0) > 0);
    } else if (activeFilter === 'RECENT') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [studySets, activeFilter, searchQuery]);

  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  if (loading && studySets.length === 0) {
    return <DashboardSkeleton onMenuPress={() => setSidebarOpen(true)} />;
  }

  const stats = calculateStats();
  const isDesktop = width >= 768;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar
        onMenuPress={() => {
          soundManager.playButtonClick();
          setSidebarOpen(true);
        }}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          {/* Animated Hero Header with Spring Drop */}
          <Animated.View
            style={[
              styles.heroBanner,
              {
                backgroundColor: theme.card,
                borderColor: borderColor,
                borderWidth: borderWidth,
                opacity: heroOpacity,
                transform: [{ translateY: heroAnim }],
              },
              Platform.OS === 'web' && {
                boxShadow: `4px 4px 0px ${shadowColor}`,
              },
            ]}
          >
            <View style={[styles.heroRow, isDesktop && { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, paddingRight: isDesktop ? 20 : 0 }}>
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
                  <Text style={styles.heroBadgeText}>DASHBOARD</Text>
                </View>
                <Text style={[styles.heroTitle, { color: theme.text }]}>STUDY DECKS</Text>
                <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                  Master your knowledge with tactile flashcards and quizzes.
                </Text>
              </View>

              {/* Integrated Header Actions */}
              <View style={[styles.heroActionsRow, !isDesktop && { marginTop: 16 }]}>
                <BrutalButton
                  title="AI GENERATE"
                  variant="secondary"
                  icon={<MaterialIcons name="auto-awesome" size={18} color="#FFFFFF" />}
                  onPress={() => {
                    soundManager.playButtonClick();
                    navigation.navigate('AIGenerate');
                  }}
                />
                <BrutalButton
                  title="NEW SET"
                  variant="primary"
                  icon={<MaterialIcons name="add" size={20} color="#FFFFFF" />}
                  onPress={() => {
                    soundManager.playButtonClick();
                    navigation.navigate('CreateSet');
                  }}
                />
              </View>
            </View>
          </Animated.View>

          {/* Animated Stats Bar with Spring Drop */}
          {studySets.length > 0 && (
            <Animated.View
              style={[
                styles.statsBanner,
                {
                  opacity: statsOpacity,
                  transform: [{ translateY: statsAnim }],
                },
              ]}
            >
              <View style={styles.statsGrid}>
                {[
                  {
                    icon: 'menu-book',
                    color: theme.primary,
                    value: stats.totalItems,
                    label: 'Total Items',
                    change: `+${stats.itemsThisWeek} this week`,
                  },
                  {
                    icon: 'assignment',
                    color: theme.accent || '#FCD34D',
                    value: stats.totalTerms,
                    label: 'Terms',
                  },
                  {
                    icon: 'help-outline',
                    color: theme.brandSecondary || '#EA580C',
                    value: stats.totalQuestions,
                    label: 'Questions',
                  },
                  {
                    icon: 'folder-open',
                    color: theme.textSecondary,
                    value: stats.totalSets,
                    label: 'Decks',
                  },
                ].map((stat, idx) => (
                  <View
                    key={stat.label}
                    style={[
                      styles.statCard,
                      {
                        minWidth: isDesktop ? 160 : '47%',
                        backgroundColor: theme.card,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                      },
                      Platform.OS === 'web' && {
                        boxShadow: `3px 3px 0px ${shadowColor}`,
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                      },
                    ]}
                  >
                    <MaterialIcons name={stat.icon} size={26} color={stat.color} />
                    <View style={styles.statCardContent}>
                      <Text style={[styles.statCardValue, { color: theme.text }]}>{stat.value}</Text>
                      <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                      {stat.change && (
                        <Text style={[styles.statCardChange, { color: theme.success || '#10B981' }]}>
                          {stat.change}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Animated Quick Search & Filter Toolbar */}
          {studySets.length > 0 && (
            <Animated.View
              style={[
                styles.toolbarContainer,
                isDesktop && styles.toolbarRow,
                {
                  opacity: toolbarOpacity,
                  transform: [{ translateY: toolbarAnim }],
                },
              ]}
            >
              {/* Search Box */}
              <View
                style={[
                  styles.searchBox,
                  isDesktop && { flex: 1, maxWidth: 420 },
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
                <MaterialIcons name="search" size={22} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search decks by title or keyword..."
                  placeholderTextColor={theme.textTertiary || '#9CA3AF'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Category Pills with Spring Press */}
              <View style={styles.filterPillsRow}>
                {[
                  { key: 'ALL', label: `ALL (${studySets.length})` },
                  { key: 'TERMS', label: 'TERMS' },
                  { key: 'QUESTIONS', label: 'QUESTIONS' },
                  { key: 'RECENT', label: 'RECENT' },
                ].map((pill) => {
                  const isActive = activeFilter === pill.key;
                  return (
                    <Pressable
                      key={pill.key}
                      onPress={() => {
                        soundManager.playButtonClick();
                        setActiveFilter(pill.key);
                      }}
                      style={({ pressed, hovered }) => {
                        const isDown = pressed;
                        const isHover = hovered && !isDown;
                        const curOffset = isDown ? 1 : isHover ? 3 : 2;
                        const trans = isDown ? 2 : isHover ? -1 : 0;

                        return [
                          styles.filterPill,
                          {
                            backgroundColor: isActive ? theme.primary : theme.card,
                            borderColor: borderColor,
                            borderWidth: borderWidth,
                            transform: [{ translateX: trans }, { translateY: trans }],
                          },
                          Platform.OS === 'web' && {
                            boxShadow: `${curOffset}px ${curOffset}px 0px ${shadowColor}`,
                            cursor: 'pointer',
                            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          },
                        ];
                      }}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          {
                            color: isActive ? '#FFFFFF' : theme.text,
                            fontWeight: isActive ? '900' : '700',
                          },
                        ]}
                      >
                        {pill.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Study Sets Grid Header */}
          {studySets.length > 0 && (
            <View
              style={[
                styles.sectionHeader,
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="style" size={22} color={theme.primary} />
                <Text style={[styles.sectionHeaderText, { color: theme.text }]}>
                  DECKS ({filteredSets.length})
                </Text>
              </View>
              <Text style={[styles.sectionHeaderSub, { color: theme.textSecondary }]}>
                GRID VIEW
              </Text>
            </View>
          )}

          {/* Decks Responsive Grid with Spring Cascade */}
          {studySets.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
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
              <MaterialIcons
                name="library-books"
                size={54}
                color={theme.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>NO STUDY SETS YET</Text>
              <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
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
          ) : filteredSets.length === 0 ? (
            <View
              style={[
                styles.emptyFilteredContainer,
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
              <MaterialIcons name="search-off" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>NO MATCHING DECKS</Text>
              <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                No decks found matching "{searchQuery}". Try a different search or filter.
              </Text>
              <BrutalButton
                title="RESET FILTERS"
                variant="outline"
                onPress={() => {
                  soundManager.playButtonClick();
                  setSearchQuery('');
                  setActiveFilter('ALL');
                }}
              />
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredSets.map((item, index) => {
                const setItem = { ...item, id: String(item.id) };
                return (
                  <PhysicalDeckCard
                    key={setItem.id}
                    item={setItem}
                    index={index}
                    cardWidth={cardWidth}
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
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Banner
  heroBanner: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 4,
  },
  heroRow: {
    flexDirection: 'column',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  // Stats Grid
  statsBanner: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statCardContent: {
    flex: 1,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statCardChange: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },

  // Toolbar (Search & Filter Pills)
  toolbarContainer: {
    marginBottom: 16,
    gap: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
    outlineStyle: 'none',
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
  },
  filterPillText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Section Header
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionHeaderSub: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Decks Grid Container
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'stretch',
  },

  // Physical Deck Stack Styles
  deckWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  stackLayer2: {
    position: 'absolute',
    borderRadius: 4,
    zIndex: 1,
  },
  stackLayer1: {
    position: 'absolute',
    borderRadius: 4,
    zIndex: 2,
  },
  mainDeckCard: {
    position: 'relative',
    zIndex: 3,
    borderRadius: 4,
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 250,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  cardContent: {
    flex: 1,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  thicknessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  thicknessText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ageText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 7,
    borderRadius: 2,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 4,
  },
  studyButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 4,
    alignItems: 'center',
  },
  emptyFilteredContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 4,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyActions: {
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
});
