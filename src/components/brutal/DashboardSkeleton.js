import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../Navbar';
import BrutalSkeleton from './BrutalSkeleton';

export function DashboardSkeleton({ onMenuPress }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const borderColor = theme.border || '#111827';
  const shadowColor = theme.shadow || '#111827';
  const borderWidth = theme.borderWidth || 2;

  // Responsive column calculation constrained to 1200px container matching HomeScreen
  const containerWidth = Math.min(width, 1200) - 32;
  const gap = 16;
  const cardWidth = useMemo(() => {
    if (containerWidth >= 960) {
      const available = containerWidth - gap * 2;
      return Math.floor(available / 3);
    } else if (containerWidth >= 600) {
      const available = containerWidth - gap;
      return Math.floor(available / 2);
    } else {
      return containerWidth;
    }
  }, [containerWidth]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Navbar onMenuPress={onMenuPress} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          {/* Hero Banner Skeleton */}
          <View
            style={[
              styles.heroBanner,
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
            <View
              style={[
                styles.heroRow,
                isDesktop && {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: isDesktop ? 20 : 0 }}>
                {/* Hero Badge */}
                <BrutalSkeleton
                  width={100}
                  height={22}
                  borderRadius={3}
                  showStripe={false}
                  style={{ marginBottom: 12 }}
                />
                {/* Hero Title */}
                <BrutalSkeleton
                  width={260}
                  height={32}
                  borderRadius={4}
                  showStripe={false}
                  style={{ marginBottom: 8 }}
                />
                {/* Hero Subtitle */}
                <BrutalSkeleton
                  width={isDesktop ? 380 : '100%'}
                  height={16}
                  borderRadius={3}
                  showStripe={false}
                />
              </View>

              {/* Action Buttons Placeholders */}
              <View
                style={[
                  styles.heroActionsRow,
                  !isDesktop && { marginTop: 16 },
                ]}
              >
                <BrutalSkeleton
                  width={130}
                  height={42}
                  borderRadius={4}
                  showStripe={false}
                />
                <BrutalSkeleton
                  width={120}
                  height={42}
                  borderRadius={4}
                  showStripe={false}
                />
              </View>
            </View>
          </View>

          {/* Stats Bar Skeleton */}
          <View style={styles.statsBanner}>
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((item) => (
                <View
                  key={item}
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
                    },
                  ]}
                >
                  <BrutalSkeleton
                    width={32}
                    height={32}
                    borderRadius={4}
                    showStripe={false}
                  />
                  <View style={styles.statCardContent}>
                    <BrutalSkeleton
                      width={48}
                      height={20}
                      borderRadius={3}
                      showStripe={false}
                      style={{ marginBottom: 6 }}
                    />
                    <BrutalSkeleton
                      width={68}
                      height={12}
                      borderRadius={3}
                      showStripe={false}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Search & Filter Toolbar Skeleton */}
          <View style={[styles.toolbarContainer, isDesktop && styles.toolbarRow]}>
            <View
              style={[
                styles.searchBoxSkeleton,
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
              <BrutalSkeleton
                width={20}
                height={20}
                borderRadius={3}
                showStripe={false}
                style={{ marginRight: 10 }}
              />
              <BrutalSkeleton
                width={200}
                height={16}
                borderRadius={3}
                showStripe={false}
              />
            </View>

            <View style={styles.filterPillsRow}>
              {[70, 75, 95, 80].map((w, idx) => (
                <BrutalSkeleton
                  key={idx}
                  width={w}
                  height={36}
                  borderRadius={4}
                  showStripe={false}
                />
              ))}
            </View>
          </View>

          {/* Section Header Skeleton */}
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
            <BrutalSkeleton
              width={100}
              height={20}
              borderRadius={3}
              showStripe={false}
            />
            <BrutalSkeleton
              width={70}
              height={14}
              borderRadius={3}
              showStripe={false}
            />
          </View>

          {/* Decks Grid Skeleton */}
          <View style={styles.decksGrid}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.deckCard,
                  {
                    width: cardWidth,
                    backgroundColor: theme.card,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                  },
                  Platform.OS === 'web' && {
                    boxShadow: `4px 4px 0px ${shadowColor}`,
                  },
                ]}
              >
                {/* Top Row: Badge + Delete Placeholder */}
                <View style={styles.cardTopRow}>
                  <BrutalSkeleton
                    width={95}
                    height={22}
                    borderRadius={3}
                    showStripe={false}
                  />
                  <BrutalSkeleton
                    width={30}
                    height={30}
                    borderRadius={3}
                    showStripe={false}
                  />
                </View>

                {/* Card Title & Description */}
                <BrutalSkeleton
                  width="85%"
                  height={22}
                  borderRadius={3}
                  showStripe={false}
                  style={{ marginTop: 12, marginBottom: 8 }}
                />
                <BrutalSkeleton
                  width="95%"
                  height={14}
                  borderRadius={3}
                  showStripe={false}
                  style={{ marginBottom: 6 }}
                />
                <BrutalSkeleton
                  width="60%"
                  height={14}
                  borderRadius={3}
                  showStripe={false}
                  style={{ marginBottom: 16 }}
                />

                {/* Meta Row */}
                <View style={styles.cardMetaRow}>
                  <BrutalSkeleton
                    width={80}
                    height={22}
                    borderRadius={3}
                    showStripe={false}
                  />
                  <BrutalSkeleton
                    width={55}
                    height={14}
                    borderRadius={3}
                    showStripe={false}
                  />
                </View>

                {/* Study Deck Button Placeholder */}
                <BrutalSkeleton
                  width="100%"
                  height={42}
                  borderRadius={4}
                  showStripe={false}
                  style={{ marginTop: 14 }}
                />
              </View>
            ))}
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
  heroBanner: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 4,
  },
  heroRow: {
    flexDirection: 'column',
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statsBanner: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statCardContent: {
    flex: 1,
  },
  toolbarContainer: {
    marginBottom: 16,
    gap: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBoxSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 4,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  decksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  deckCard: {
    padding: 18,
    borderRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default DashboardSkeleton;
