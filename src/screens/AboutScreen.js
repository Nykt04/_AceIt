import React, { useState, useEffect } from 'react'; 
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function AboutScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const windowWidth = useWindowDimensions().width;
  const isSmall = windowWidth < 480;
  const isMedium = windowWidth < 768;
  const isLarge = windowWidth >= 768;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>About AceIt</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>What is AceIt?</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            AceIt is a powerful study companion designed to help you master any subject. Create custom study sets, generate flashcards with AI, and track your learning progress.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Features</Text>
          <View style={styles.featureList}>
            <View style={[styles.featureItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>AI-powered flashcard generation</Text>
            </View>
            <View style={[styles.featureItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>Create custom study sets</Text>
            </View>
            <View style={[styles.featureItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>Interactive study mode</Text>
            </View>
            <View style={[styles.featureItem, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>Local data storage</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Get Started</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Start by creating a new study set or using our AI to generate one. Study at your own pace and achieve your learning goals!
          </Text>

          <Text style={[styles.version, { color: theme.textTertiary }]}>Version 1.0.0</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primaryAccent, borderColor: theme.primaryAccent }]}
          onPress={() => navigation.navigate('TermsAndConditions')}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}> Next: Terms & Conditions </Text>
        </TouchableOpacity>
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
    padding: Dimensions.get('window').width < 480 ? 16 : 20,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: Dimensions.get('window').width < 768 ? 20 : 32,
    alignItems: 'center',
    paddingTop: Dimensions.get('window').width < 480 ? 12 : 20,
  },
  title: {
    fontSize: Dimensions.get('window').width < 480 ? 24 : Dimensions.get('window').width < 768 ? 28 : 36,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: Dimensions.get('window').width < 480 ? 16 : Dimensions.get('window').width < 768 ? 18 : 22,
    fontWeight: '700',
    marginTop: Dimensions.get('window').width < 480 ? 16 : 20,
    marginBottom: 10,
  },
  description: {
    fontSize: Dimensions.get('window').width < 480 ? 13 : Dimensions.get('window').width < 768 ? 14 : 15,
    lineHeight: Dimensions.get('window').width < 480 ? 20 : 24,
    marginBottom: 8,
  },
  featureList: {
    marginTop: 12,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: Dimensions.get('window').width < 480 ? 10 : 12,
    paddingVertical: Dimensions.get('window').width < 480 ? 6 : 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  featureBullet: {
    fontSize: Dimensions.get('window').width < 480 ? 16 : 20,
    marginRight: Dimensions.get('window').width < 480 ? 10 : 12,
  },
  featureText: {
    fontSize: Dimensions.get('window').width < 480 ? 13 : Dimensions.get('window').width < 768 ? 14 : 15,
    flex: 1,
  },
  version: {
    fontSize: 11,
    marginTop: Dimensions.get('window').width < 480 ? 16 : 24,
    textAlign: 'center',
  },
  button: {
    paddingVertical: Dimensions.get('window').width < 480 ? 12 : 14,
    paddingHorizontal: Dimensions.get('window').width < 480 ? 16 : 20,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: Dimensions.get('window').width < 480 ? 16 : 24,
  },
  buttonText: {
    fontSize: Dimensions.get('window').width < 480 ? 14 : Dimensions.get('window').width < 768 ? 15 : 16,
    fontWeight: '600',
  },
});
