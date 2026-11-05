import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useStudy } from '../context/StudyContext';
import { useTheme } from '../context/ThemeContext';
import { exportStudySet } from '../services/exportService';
import { generateQuestionsFromTerms } from '../services/aiService';
import soundManager from '../services/soundService';
import EditableFlashcard from '../components/EditableFlashcard';
import { BrutalCard, BrutalButton, BrutalBadge } from '../components/brutal';

// Interactive Flip Index Card Component with 3D Flip and Spring Micro-Interactions
const InteractiveIndexCard = ({ term, definition, index, theme, cardWidth }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index * 35, 300);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 7,
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
  }, [index, opacityAnim, slideAnim]);

  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  const handleSpeak = (e) => {
    e.stopPropagation?.();
    soundManager.playButtonClick();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = isFlipped ? definition : term;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFlip = () => {
    soundManager.playButtonClick();
    const nextVal = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue: nextVal,
      friction: 7,
      tension: 65,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    setIsFlipped(!isFlipped);
  };

  return (
    <Animated.View
      style={{
        width: cardWidth,
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Pressable
        onPress={handleFlip}
        style={({ pressed, hovered }) => {
          const isDown = pressed;
          const isHover = hovered && !isDown;
          const curShadow = isDown ? 1 : isHover ? 5 : 3;
          const trans = isDown ? 2 : isHover ? -2 : 0;

          return [
            styles.flipCard,
            {
              backgroundColor: isFlipped ? (theme.isDark ? '#232731' : '#F4F5F7') : theme.card,
              borderColor: borderColor,
              borderWidth: borderWidth,
              transform: [{ translateX: trans }, { translateY: trans }],
            },
            Platform.OS === 'web' && {
              boxShadow: `${curShadow}px ${curShadow}px 0px ${shadowColor}`,
              cursor: 'pointer',
              transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease',
            },
          ];
        }}
        accessibilityLabel={`Card ${index + 1}: ${isFlipped ? 'Definition' : 'Term'}. Tap to flip.`}
      >
        {/* Card Header Strip */}
        <View style={styles.flipCardHeader}>
          <View style={styles.flipCardHeaderLeft}>
            <View
              style={[
                styles.cardNumberBadge,
                {
                  backgroundColor: theme.muted,
                  borderColor: borderColor,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Text style={[styles.cardNumberText, { color: theme.text }]}>#{index + 1}</Text>
            </View>
            <BrutalBadge
              label={isFlipped ? 'DEFINITION' : 'TERM'}
              color={isFlipped ? (theme.accent || '#FCD34D') : theme.primary}
              textColor={isFlipped ? '#111827' : '#FFFFFF'}
            />
          </View>

          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={handleSpeak}
              style={[
                styles.speakButton,
                {
                  borderColor: borderColor,
                  borderWidth: 1.5,
                  backgroundColor: theme.card,
                },
              ]}
              accessibilityLabel="Speak card text"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="volume-up" size={16} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Card Main Body */}
        <View style={styles.flipCardBody}>
          {isFlipped ? (
            <Text style={[styles.definitionText, { color: theme.text }]}>
              {definition || 'No definition provided.'}
            </Text>
          ) : (
            <Text style={[styles.termText, { color: theme.text }]}>
              {term || 'Empty term'}
            </Text>
          )}
        </View>

        {/* Card Footer Hint */}
        <View style={styles.flipCardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons
              name={isFlipped ? 'replay' : 'flip'}
              size={14}
              color={theme.textTertiary}
            />
            <Text style={[styles.flipHintText, { color: theme.textTertiary }]}>
              {isFlipped ? 'TAP TO SHOW TERM' : 'TAP TO REVEAL DEFINITION'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function SetDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { studySets, deleteStudySet, updateStudySet } = useStudy();
  const setFromParams = route.params?.set;
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'edit'
  const [set, setSet] = useState(null);
  const [converting, setConverting] = useState(false);

  // Staggered entry animation
  const headerAnim = useRef(new Animated.Value(-16)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: 0,
        friction: 7,
        tension: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [headerAnim, headerOpacity]);

  const { width } = useWindowDimensions();

  // Responsive column width for index cards grid (constrained to 1200px)
  const cardWidth = useMemo(() => {
    const containerWidth = Math.min(width, 1200) - 32;
    const gap = 14;
    if (containerWidth >= 960) {
      // 3 cards on desktop
      const available = containerWidth - gap * 2;
      return Math.floor(available / 3);
    } else if (containerWidth >= 600) {
      // 2 cards on tablet
      const available = containerWidth - gap;
      return Math.floor(available / 2);
    } else {
      // 1 card on mobile
      return containerWidth;
    }
  }, [width]);

  useEffect(() => {
    const currentSet = studySets.find((s) => s.id === setFromParams?.id) || setFromParams;
    setSet(currentSet);
  }, [studySets, setFromParams]);

  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  if (!set) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.navBar, { borderBottomColor: borderColor, borderBottomWidth: borderWidth }]}>
          <BrutalButton
            title="BACK"
            variant="outline"
            icon={<MaterialIcons name="arrow-back" size={18} color={theme.text} />}
            onPress={() => navigation.goBack()}
          />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.text }]}>Set not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const termsOnly = set.terms?.length || 0;
  const questionsOnly = set.questions?.length || 0;
  const hasContent = termsOnly > 0 || questionsOnly > 0;

  const onDelete = async () => {
    soundManager.playButtonClick();
    const proceed =
      Platform.OS === 'web'
        ? window.confirm(`Permanently delete deck "${set.title}"?`)
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
    if (!set || !set.terms || !set.terms[index]) return;
    const termToDelete = set.terms[index];
    const termName = termToDelete?.term || 'this term';

    const performDelete = async () => {
      try {
        const updatedTerms = set.terms.filter((_, i) => i !== index);
        await updateStudySet(set.id, { terms: updatedTerms });
      } catch (error) {
        Alert.alert('Error', 'Failed to delete term: ' + error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${termName}"?`)) performDelete();
    } else {
      Alert.alert('Delete Term', `Delete "${termName}"?`, [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const handleEditQuestion = async (index, updatedQuestion) => {
    const updatedQuestions = [...(set.questions || [])];
    updatedQuestions[index] = updatedQuestion;
    await updateStudySet(set.id, { questions: updatedQuestions });
    Alert.alert('Success', 'Question updated!');
  };

  const handleDeleteQuestion = (index) => {
    const performDelete = async () => {
      try {
        const updatedQuestions = set.questions.filter((_, i) => i !== index);
        await updateStudySet(set.id, { questions: updatedQuestions });
      } catch (error) {
        Alert.alert('Error', 'Failed to delete question: ' + error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this question?')) performDelete();
    } else {
      Alert.alert('Delete Question', 'Delete this question?', [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const handleAddTerm = async () => {
    soundManager.playButtonClick();
    const updatedTerms = [...(set.terms || []), { term: '', definition: '' }];
    await updateStudySet(set.id, { terms: updatedTerms });
    setViewMode('edit');
  };

  const handleConvertToQuestions = async () => {
    const validTerms = (set.terms || []).filter((t) => t.term?.trim() && t.definition?.trim());
    if (validTerms.length === 0) {
      Alert.alert('No terms', 'Add at least one term with both term and definition to convert.');
      return;
    }

    setConverting(true);
    try {
      const generatedQuestions = await generateQuestionsFromTerms(validTerms, validTerms.length);
      if (!generatedQuestions || generatedQuestions.length === 0) {
        Alert.alert('No questions generated', 'Try again or add more detailed terms.');
        return;
      }
      const existingQuestions = set.questions || [];
      const allQuestions = [...existingQuestions, ...generatedQuestions];
      await updateStudySet(set.id, { questions: allQuestions });
      setSet({ ...set, questions: allQuestions });
      Alert.alert('Success', `Generated ${generatedQuestions.length} questions from terms!`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to convert terms');
    } finally {
      setConverting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar (Constrained to 1200px) */}
      <View
        style={[
          styles.navBar,
          {
            borderBottomColor: borderColor,
            borderBottomWidth: borderWidth,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={styles.navBarInner}>
          <BrutalButton
            title="BACK TO DECKS"
            variant="outline"
            icon={<MaterialIcons name="arrow-back" size={18} color={theme.text} />}
            onPress={() => {
              soundManager.playButtonClick();
              navigation.goBack();
            }}
          />
          <BrutalBadge
            label={`${termsOnly + questionsOnly} ITEMS`}
            color={theme.accent || '#FCD34D'}
            textColor="#111827"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          {/* Animated Set Header Card */}
          <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerAnim }] }}>
            <BrutalCard accentColor={theme.primary} headerTitle="STUDY DECK OVERVIEW">
              <Text style={[styles.title, { color: theme.text }]}>{set.title}</Text>
              {set.description ? (
                <Text style={[styles.desc, { color: theme.textSecondary }]}>
                  {set.description}
                </Text>
              ) : null}

              <View style={styles.badgeRow}>
                <BrutalBadge
                  label={`${termsOnly} TERMS`}
                  color={theme.primary}
                  textColor="#FFFFFF"
                />
                <BrutalBadge
                  label={`${questionsOnly} QUESTIONS`}
                  color={theme.brandSecondary || '#EA580C'}
                  textColor="#FFFFFF"
                />
                <BrutalBadge
                  label="READY TO STUDY"
                  color={theme.success || '#10B981'}
                  textColor="#FFFFFF"
                />
              </View>
            </BrutalCard>
          </Animated.View>

          {/* Study Modes */}
          {hasContent ? (
            <View style={styles.modesSection}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                STUDY MODES
              </Text>

              <View style={[styles.modeCardsRow, width >= 640 && { flexDirection: 'row' }]}>
                {/* Flashcards Mode with Spring Hover */}
                <Pressable
                  onPress={() => {
                    soundManager.playButtonClick();
                    navigation.navigate('Study', { set, mode: 'flashcards' });
                  }}
                  style={({ pressed, hovered }) => {
                    const isDown = pressed;
                    const isHover = hovered && !isDown;
                    const curOffset = isDown ? 1 : isHover ? 5 : 3;
                    const trans = isDown ? 2 : isHover ? -2 : 0;

                    return [
                      styles.modeCard,
                      width >= 640 && { flex: 1 },
                      {
                        backgroundColor: theme.card,
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
                  <View
                    style={[
                      styles.modeStripe,
                      {
                        backgroundColor: theme.primary,
                        borderBottomWidth: borderWidth,
                        borderBottomColor: borderColor,
                      },
                    ]}
                  >
                    <MaterialIcons name="style" size={22} color="#FFFFFF" />
                    <Text style={styles.modeStripeTitle}>FLASHCARDS MODE</Text>
                  </View>
                  <View style={styles.modeBody}>
                    <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                      Interactive flip cards with tactile self-rating physics.
                    </Text>
                    <Text style={[styles.modeAction, { color: theme.primary }]}>
                      START FLASHCARDS →
                    </Text>
                  </View>
                </Pressable>

                {/* Quiz Mode with Spring Hover */}
                <Pressable
                  onPress={() => {
                    soundManager.playButtonClick();
                    navigation.navigate('Study', { set, mode: 'quiz' });
                  }}
                  style={({ pressed, hovered }) => {
                    const isDown = pressed;
                    const isHover = hovered && !isDown;
                    const curOffset = isDown ? 1 : isHover ? 5 : 3;
                    const trans = isDown ? 2 : isHover ? -2 : 0;

                    return [
                      styles.modeCard,
                      width >= 640 && { flex: 1 },
                      {
                        backgroundColor: theme.card,
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
                  <View
                    style={[
                      styles.modeStripe,
                      {
                        backgroundColor: theme.brandSecondary || '#EA580C',
                        borderBottomWidth: borderWidth,
                        borderBottomColor: borderColor,
                      },
                    ]}
                  >
                    <MaterialIcons name="psychology" size={22} color="#FFFFFF" />
                    <Text style={styles.modeStripeTitle}>QUIZ MODE</Text>
                  </View>
                  <View style={styles.modeBody}>
                    <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>
                      Multiple choice challenge with immediate grading.
                    </Text>
                    <Text
                      style={[
                        styles.modeAction,
                        { color: theme.brandSecondary || '#EA580C' },
                      ]}
                    >
                      START QUIZ →
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Deck Cards Section: View Switcher (Flip Grid vs Edit Mode) */}
              <View style={styles.cardsHeaderSection}>
                <View style={styles.cardsHeaderTitleRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="grid-view" size={20} color={theme.primary} />
                    <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>
                      DECK CARDS ({termsOnly})
                    </Text>
                  </View>

                  {/* View Mode Segmented Controls */}
                  <View
                    style={[
                      styles.segmentedContainer,
                      {
                        backgroundColor: theme.muted,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        soundManager.playButtonClick();
                        setViewMode('preview');
                      }}
                      style={({ pressed, hovered }) => [
                        styles.segmentBtn,
                        viewMode === 'preview' && {
                          backgroundColor: theme.card,
                          borderColor: borderColor,
                          borderWidth: 1.5,
                        },
                        Platform.OS === 'web' && {
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="flip"
                        size={15}
                        color={viewMode === 'preview' ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          {
                            color: viewMode === 'preview' ? theme.text : theme.textSecondary,
                            fontWeight: viewMode === 'preview' ? '900' : '700',
                          },
                        ]}
                      >
                        FLIP GRID
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        soundManager.playButtonClick();
                        setViewMode('edit');
                      }}
                      style={({ pressed, hovered }) => [
                        styles.segmentBtn,
                        viewMode === 'edit' && {
                          backgroundColor: theme.card,
                          borderColor: borderColor,
                          borderWidth: 1.5,
                        },
                        Platform.OS === 'web' && {
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="edit"
                        size={15}
                        color={viewMode === 'edit' ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          {
                            color: viewMode === 'edit' ? theme.text : theme.textSecondary,
                            fontWeight: viewMode === 'edit' ? '900' : '700',
                          },
                        ]}
                      >
                        EDIT CARDS
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Display: Flip-Card Grid Preview with Staggered Cascading Entry */}
              {viewMode === 'preview' ? (
                <View>
                  {set.terms && set.terms.length > 0 ? (
                    <View style={styles.cardsGridContainer}>
                      {set.terms.map((term, index) => (
                        <InteractiveIndexCard
                          key={`preview-card-${index}`}
                          term={term.term}
                          definition={term.definition}
                          index={index}
                          theme={theme}
                          cardWidth={cardWidth}
                        />
                      ))}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.emptyBox,
                        {
                          backgroundColor: theme.card,
                          borderColor: borderColor,
                          borderWidth: borderWidth,
                        },
                      ]}
                    >
                      <Text style={[styles.emptyTitle, { color: theme.text }]}>NO TERMS IN DECK</Text>
                      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                        Add your first flashcard term to start previewing and studying.
                      </Text>
                      <BrutalButton
                        title="+ ADD FIRST TERM"
                        variant="primary"
                        onPress={handleAddTerm}
                      />
                    </View>
                  )}

                  {set.terms && set.terms.length > 0 && (
                    <BrutalButton
                      title="+ ADD NEW TERM"
                      variant="outline"
                      icon={<MaterialIcons name="add" size={18} color={theme.text} />}
                      onPress={handleAddTerm}
                      style={{ marginTop: 14 }}
                    />
                  )}
                </View>
              ) : (
                /* Display: Full Inline Editable Cards */
                <View style={styles.editorContainer}>
                  {set.terms && set.terms.length > 0 && (
                    <View style={{ marginBottom: 18 }}>
                      <View style={styles.editorHeaderRow}>
                        <Text style={[styles.editorSectionTitle, { color: theme.text }]}>
                          EDITING TERMS ({set.terms.length})
                        </Text>
                        <BrutalButton
                          title="+ ADD TERM"
                          variant="secondary"
                          onPress={handleAddTerm}
                          style={{ minHeight: 38, paddingVertical: 6, paddingHorizontal: 12 }}
                        />
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
                    </View>
                  )}
                </View>
              )}

              {/* Questions Bank Section */}
              {set.questions && set.questions.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionHeading, { color: theme.text }]}>
                    QUESTION BANK ({set.questions.length})
                  </Text>
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
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: theme.card,
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: theme.text }]}>NO ITEMS IN DECK</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Add terms manually or generate questions with AI to start studying.
              </Text>
              <BrutalButton
                title="GENERATE WITH AI"
                variant="primary"
                icon={<MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />}
                onPress={() => navigation.navigate('AIGenerate', { existingSet: set })}
              />
            </View>
          )}

          {/* Deck Utilities & Actions */}
          <View style={styles.utilitiesSection}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>DECK UTILITIES</Text>
            <View style={styles.utilityGrid}>
              {set.terms && set.terms.length > 0 && (
                <BrutalButton
                  title={converting ? 'CONVERTING...' : 'AI CONVERT TO QUESTIONS'}
                  variant="secondary"
                  disabled={converting}
                  icon={
                    converting ? (
                      <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                    ) : (
                      <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
                    )
                  }
                  onPress={handleConvertToQuestions}
                />
              )}
              <BrutalButton
                title="EXPORT AS PDF"
                variant="outline"
                icon={<MaterialIcons name="picture-as-pdf" size={20} color={theme.text} />}
                onPress={() => exportStudySet(set, 'pdf')}
              />
              <BrutalButton
                title="EXPORT AS DOCX"
                variant="outline"
                icon={<MaterialIcons name="description" size={20} color={theme.text} />}
                onPress={() => exportStudySet(set, 'docx')}
              />
              <BrutalButton
                title="DELETE DECK"
                variant="danger"
                icon={<MaterialIcons name="delete" size={20} color="#FFFFFF" />}
                onPress={onDelete}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBarInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  modesSection: {
    marginTop: 14,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modeCardsRow: {
    gap: 14,
    marginBottom: 16,
  },
  modeCard: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  modeStripe: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  modeStripeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  modeBody: {
    padding: 14,
  },
  modeDesc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 10,
  },
  modeAction: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Cards Header Section with Segmented View Toggle
  cardsHeaderSection: {
    marginTop: 8,
    marginBottom: 14,
  },
  cardsHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 4,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
  },
  segmentBtnText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Flip Index Cards Grid
  cardsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'stretch',
  },
  flipCard: {
    borderRadius: 4,
    padding: 16,
    minHeight: 170,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  flipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  flipCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  cardNumberText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  speakButton: {
    padding: 4,
    borderRadius: 3,
  },
  flipCardBody: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  termText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 24,
  },
  definitionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  flipCardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
    marginTop: 6,
  },
  flipHintText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Editor Styles
  editorContainer: {
    marginTop: 10,
  },
  editorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editorSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 4,
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  utilitiesSection: {
    marginTop: 20,
  },
  utilityGrid: {
    gap: 10,
  },
});
