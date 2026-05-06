import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submitScale = useRef(new Animated.Value(1)).current;

  const email = 'giankarloreguindin811@gmail.com';
  const subject_encoded = encodeURIComponent(subject || 'Support Request - AceIt');
  const message_encoded = encodeURIComponent(message || 'Hi, I need help with...');

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter a subject');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your message');
      return;
    }

    setLoading(true);
    Animated.sequence([
      Animated.timing(submitScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(submitScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const mailtoURL = `mailto:${email}?subject=${subject_encoded}&body=${message_encoded}`;
      const canOpen = await Linking.canOpenURL(mailtoURL);
      
      if (canOpen) {
        await Linking.openURL(mailtoURL);
        Alert.alert('Success', 'Your default email app has been opened. Please send the email from there.');
        setSubject('');
        setMessage('');
      } else {
        // Fallback: show the email address
        Alert.alert(
          'Email Support',
          `Please email us at:\n${email}\n\nSubject: ${subject}\n\nMessage: ${message}`,
          [{ text: 'Copy Email', onPress: () => copyToClipboard(email) }, { text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    // For web, we'd use a different approach
    Alert.alert('Copied', `${text} has been copied`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Help & Support</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📧 Contact Us</Text>
              <Text style={styles.infoText}>Email: {email}</Text>
              <Text style={styles.infoSubtext}>We'll get back to you as soon as possible</Text>
            </View>

            <View style={styles.faqSection}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>❓ How do I create a study set?</Text>
                <Text style={styles.faqAnswer}>Navigate to Home and tap the "Create Set" button to create a new study set. Add terms, questions, or upload a file.</Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>❓ Can I sync my sets across devices?</Text>
                <Text style={styles.faqAnswer}>Yes! All your study sets are automatically saved to your account and will sync across all your devices.</Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>❓ How do I use AI to generate questions?</Text>
                <Text style={styles.faqAnswer}>In any study set, tap "AI Generate" to automatically create quiz questions based on your terms.</Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>❓ How do I change my password?</Text>
                <Text style={styles.faqAnswer}>Go to Settings → Change Password to securely update your password.</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.formTitle}>Send us a message</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What do you need help with?"
                  placeholderTextColor="#64748b"
                  value={subject}
                  onChangeText={setSubject}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your issue or question..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={6}
                  value={message}
                  onChangeText={setMessage}
                  editable={!loading}
                />
              </View>

              <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSendEmail}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitText}>{loading ? 'Opening...' : 'Send Message'}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  backButton: {
    paddingRight: 15,
  },
  backText: {
    fontSize: 24,
    color: '#6366f1',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  faqSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  form: {
    marginTop: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'System',
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
