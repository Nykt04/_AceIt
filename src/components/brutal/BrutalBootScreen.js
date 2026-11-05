import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Platform, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function BrutalBootScreen({ isReady = true, onFinished }) {
  const { theme } = useTheme();

  // Entrance and animation states
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardTranslateY = useRef(new Animated.Value(-24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [percentText, setPercentText] = useState('0');

  const phases = [
    'MOUNTING TACTILE ENGINE...',
    'SYNCING STORAGE ADAPTERS...',
    'CONFIGURING STUDY DECKS...',
    'INITIALIZING WORKSPACE...',
    'SYSTEM READY',
  ];

  // Blinking status indicator loop
  useEffect(() => {
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    blinkLoop.start();
    return () => blinkLoop.stop();
  }, [blinkAnim]);

  // Entrance spring animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [cardOpacity, cardScale, cardTranslateY]);

  // Listen to animated progress value to update monospace counter & phase label
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
      setPercentText(String(pct));

      if (pct < 30) {
        setPhaseIndex(0);
      } else if (pct < 60) {
        setPhaseIndex(1);
      } else if (pct < 85) {
        setPhaseIndex(2);
      } else if (pct < 100) {
        setPhaseIndex(3);
      } else {
        setPhaseIndex(4);
      }
    });

    return () => progressAnim.removeListener(listenerId);
  }, [progressAnim]);

  // Handle progress fill and completion
  useEffect(() => {
    let timer;

    if (!isReady) {
      // Crawl up to 80% while waiting for async initialization
      Animated.timing(progressAnim, {
        toValue: 0.8,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      // Rush to 100% when ready
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        // Hold on 100% for brief tactile satisfaction, then fade exit
        timer = setTimeout(() => {
          Animated.timing(exitOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            if (onFinished) onFinished();
          });
        }, 180);
      });
    }

    return () => clearTimeout(timer);
  }, [isReady, progressAnim, exitOpacity, onFinished]);

  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: theme.background,
          opacity: exitOpacity,
        },
      ]}
    >
      {/* Background Watermark / Grid Decal */}
      <View style={styles.backgroundDecalWrapper} pointerEvents="none">
        <Text
          style={[
            styles.backgroundDecalText,
            { color: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
          ]}
        >
          ACEIT
        </Text>
      </View>

      {/* Main Neubrutalist Boot Card */}
      <Animated.View
        style={[
          styles.bootCard,
          {
            backgroundColor: theme.card,
            borderColor: borderColor,
            borderWidth: borderWidth,
            opacity: cardOpacity,
            transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
          },
          Platform.OS === 'web' && {
            boxShadow: `6px 6px 0px ${shadowColor}`,
          },
        ]}
      >
        {/* Terminal Header Bar */}
        <View
          style={[
            styles.cardHeader,
            {
              backgroundColor: theme.isDark ? '#1F2937' : '#F1F5F9',
              borderBottomColor: borderColor,
              borderBottomWidth: borderWidth,
            },
          ]}
        >
          <View style={styles.headerStatusRow}>
            <Animated.View
              style={[
                styles.statusLed,
                {
                  opacity: blinkAnim,
                  backgroundColor: '#10B981',
                  borderColor: borderColor,
                },
              ]}
            />
            <Text
              style={[
                styles.headerTagText,
                { color: theme.isDark ? '#94A3B8' : '#475569' },
              ]}
            >
              BOOT SEQUENCE // v2.0
            </Text>
          </View>

          <View style={styles.windowDecor}>
            <View style={[styles.decorSquare, { borderColor }]} />
            <View style={[styles.decorSquare, { borderColor }]} />
            <View style={[styles.decorSquare, { borderColor }]} />
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Logo Badge Stamp */}
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: theme.accent || '#FCD34D',
                borderColor: borderColor,
                borderWidth: borderWidth,
              },
              Platform.OS === 'web' && {
                boxShadow: `3px 3px 0px ${shadowColor}`,
              },
            ]}
          >
            <Text style={[styles.logoText, { color: '#111827' }]}>ACEIT</Text>
          </View>

          <Text style={[styles.systemTitle, { color: theme.text }]}>
            TACTILE STUDY SYSTEM
          </Text>
          <Text style={[styles.systemSubtitle, { color: theme.textSecondary }]}>
            High-efficiency flashcard & question engine
          </Text>

          {/* Progress Container */}
          <View style={styles.progressSection}>
            <View style={styles.progressMetaRow}>
              <Text
                style={[
                  styles.statusPhaseText,
                  { color: theme.textSecondary },
                ]}
                numberOfLines={1}
              >
                &gt; {phases[phaseIndex]}
              </Text>
              <Text
                style={[
                  styles.percentNumberText,
                  { color: theme.primary },
                ]}
              >
                [{percentText}%]
              </Text>
            </View>

            {/* Brutalist Track */}
            <View
              style={[
                styles.progressTrack,
                {
                  borderColor: borderColor,
                  borderWidth: borderWidth,
                  backgroundColor: theme.isDark ? '#111827' : '#E2E8F0',
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: widthInterpolation,
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                {/* Visual striping accent */}
                <View
                  style={[
                    styles.stripeCap,
                    { borderLeftColor: borderColor, borderLeftWidth: 2 },
                  ]}
                />
              </Animated.View>
            </View>
          </View>

          {/* Footer Metadata Stamp */}
          <View
            style={[
              styles.metaFooter,
              {
                borderTopColor: theme.isDark ? '#374151' : '#E5E7EB',
                borderTopWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.metaFooterText,
                { color: theme.textTertiary || '#9CA3AF' },
              ]}
            >
              KERNEL: READY // CLIENT: WEB // MEM: ACTIVE
            </Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  backgroundDecalWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  backgroundDecalText: {
    fontSize: 160,
    fontWeight: '900',
    letterSpacing: 10,
    userSelect: 'none',
  },
  bootCard: {
    width: 380,
    maxWidth: '92%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLed: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.5,
  },
  headerTagText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  windowDecor: {
    flexDirection: 'row',
    gap: 5,
  },
  decorSquare: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderRadius: 1,
  },
  cardBody: {
    padding: 24,
    alignItems: 'center',
  },
  logoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 14,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  systemTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  systemSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressSection: {
    width: '100%',
    marginBottom: 20,
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPhaseText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  percentNumberText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 20,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stripeCap: {
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  metaFooter: {
    width: '100%',
    paddingTop: 12,
    alignItems: 'center',
  },
  metaFooterText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default BrutalBootScreen;
