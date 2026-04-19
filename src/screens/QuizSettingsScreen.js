import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function QuizSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { set } = route.params || {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  const handleStartQuiz = () => {
    if (!set || !set.questions || set.questions.length === 0) {
      return;
    }
    const selectedCount = Math.min(numQuestions, set.questions.length);
    navigation.navigate('Study', {
      set: {
        ...set,
        questions: set.questions.slice(0, selectedCount),
      },
      mode: 'quiz',
      settings: {
        numQuestions: selectedCount,
        shuffleQuestions,
        showAnswers,
        timedMode,
        timePerQuestion,
      },
    });
  };

  if (!set || !set.questions || set.questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar onMenuPress={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No questions available</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const maxQuestions = set.questions.length;

  return (
    <SafeAreaView style={styles.container}>
      <Navbar onMenuPress={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Settings</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.setTitle}>{set.title}</Text>
          <Text style={styles.availableText}>
            {maxQuestions} questions available
          </Text>
        </View>

        {/* Number of Questions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}> Number of Questions</Text>
            <Text style={styles.sectionValue}>{numQuestions}</Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.quickSelectRow}>
              {[5, 10, 15, 20].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.quickSelectButton,
                    count <= maxQuestions && numQuestions === count && styles.quickSelectActive,
                    count > maxQuestions && styles.quickSelectDisabled,
                  ]}
                  onPress={() => setNumQuestions(Math.min(count, maxQuestions))}
                  disabled={count > maxQuestions}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.quickSelectText,
                      count <= maxQuestions && numQuestions === count && styles.quickSelectTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Quiz Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}> Options</Text>
          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Shuffle Questions</Text>
              <Text style={styles.optionDesc}>Randomize question order</Text>
            </View>
            <Switch
              value={shuffleQuestions}
              onValueChange={setShuffleQuestions}
              trackColor={{ false: '#334155', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Show Correct Answers</Text>
              <Text style={styles.optionDesc}>Reveal answers immediately</Text>
            </View>
            <Switch
              value={showAnswers}
              onValueChange={setShowAnswers}
              trackColor={{ false: '#334155', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.optionItem}>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Timed Mode</Text>
              <Text style={styles.optionDesc}>Set time limit per question</Text>
            </View>
            <Switch
              value={timedMode}
              onValueChange={setTimedMode}
              trackColor={{ false: '#334155', true: '#6366f1' }}
              thumbColor="#fff"
            />
          </View>

          {timedMode && (
            <View style={styles.timedModeSettings}>
              <Text style={styles.timedModeLabel}>Time per question (seconds)</Text>
              <View style={styles.timeSelectRow}>
                {[15, 30, 45, 60].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      timePerQuestion === time && styles.timeButtonActive,
                    ]}
                    onPress={() => setTimePerQuestion(time)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        timePerQuestion === time && styles.timeButtonTextActive,
                      ]}
                    >
                      {time}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}> Quiz Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Questions:</Text>
            <Text style={styles.summaryValue}>{numQuestions}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mode:</Text>
            <Text style={styles.summaryValue}>
              {timedMode ? `Timed (${timePerQuestion}s)` : 'Untimed'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Show Answers:</Text>
            <Text style={styles.summaryValue}>{showAnswers ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartQuiz}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}> Start Quiz</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  back: {
    fontSize: 16,
    color: '#94a3b8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  infoBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  setTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  availableText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  quickSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickSelectActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  quickSelectDisabled: {
    opacity: 0.5,
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  quickSelectTextActive: {
    color: '#fff',
  },
  optionItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  timedModeSettings: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  timedModeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  timeSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  timeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  summaryBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderTopWidth: 2,
    borderTopColor: '#6366f1',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
  startButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
