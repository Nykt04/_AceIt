import React, { useState, useEffect } from 'react'; 
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AboutScreen() {
  const navigation = useNavigation();
  const windowWidth = useWindowDimensions().width;
  const isSmall = windowWidth < 480;
  const isMedium = windowWidth < 768;
  const isLarge = windowWidth >= 768;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>About AceIt</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>What is AceIt?</Text>
          <Text style={styles.description}>
            AceIt is a powerful study companion designed to help you master any subject. Create custom study sets, generate flashcards with AI, and track your learning progress.
          </Text>

          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}></Text>
              <Text style={styles.featureText}>AI-powered flashcard generation</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}></Text>
              <Text style={styles.featureText}>Create custom study sets</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}></Text>
              <Text style={styles.featureText}>Interactive study mode</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}></Text>
              <Text style={styles.featureText}>Local data storage</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Get Started</Text>
          <Text style={styles.description}>
            Start by creating a new study set or using our AI to generate one. Study at your own pace and achieve your learning goals!
          </Text>

          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}> Go to Home </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    color: '#f8fafc',
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
    color: '#e2e8f0',
    marginTop: Dimensions.get('window').width < 480 ? 16 : 20,
    marginBottom: 10,
  },
  description: {
    fontSize: Dimensions.get('window').width < 480 ? 13 : Dimensions.get('window').width < 768 ? 14 : 15,
    color: '#cbd5e1',
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
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  featureBullet: {
    fontSize: Dimensions.get('window').width < 480 ? 16 : 20,
    marginRight: Dimensions.get('window').width < 480 ? 10 : 12,
  },
  featureText: {
    fontSize: Dimensions.get('window').width < 480 ? 13 : Dimensions.get('window').width < 768 ? 14 : 15,
    color: '#cbd5e1',
    flex: 1,
  },
  version: {
    fontSize: 11,
    color: '#64748b',
    marginTop: Dimensions.get('window').width < 480 ? 16 : 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: Dimensions.get('window').width < 480 ? 12 : 14,
    paddingHorizontal: Dimensions.get('window').width < 480 ? 16 : 20,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: Dimensions.get('window').width < 480 ? 16 : 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: Dimensions.get('window').width < 480 ? 14 : Dimensions.get('window').width < 768 ? 15 : 16,
    fontWeight: '600',
  },
});
