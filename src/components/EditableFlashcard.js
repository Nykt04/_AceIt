import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function EditableFlashcard({ term, definition, index, onEdit, onDelete, onAddTerm, style, showAddButton }) {
  const { theme } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTerm, setEditTerm] = useState(term);
  const [editDef, setEditDef] = useState(definition);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleSaveEdit = () => {
    if (editTerm.trim() || editDef.trim()) {
      onEdit(index, { term: editTerm.trim(), definition: editDef.trim() });
      setShowEditModal(false);
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <>
      <TouchableOpacity onPress={handleFlip} style={[styles.cardContainer, style]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.secondary,
              borderColor: theme.border,
              transform: [{ rotateY: frontInterpolate }],
              opacity: frontOpacity,
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.label, { color: theme.textTertiary }]}>Term</Text>
            <Text style={[styles.cardText, { color: theme.text }]} numberOfLines={4}>
              {term || 'Empty'}
            </Text>
            <Text style={[styles.flipHint, { color: theme.textTertiary }]}>Tap to flip</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              backgroundColor: theme.primary,
              borderColor: theme.primaryAccent,
              transform: [{ rotateY: backInterpolate }],
              opacity: backOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.cardContent}>
            <Text style={[styles.label, { color: theme.textTertiary }]}>Definition</Text>
            <Text style={[styles.cardText, { color: theme.text }]} numberOfLines={4}>
              {definition || 'Empty'}
            </Text>
            <Text style={[styles.flipHint, { color: theme.textTertiary }]}>Tap to flip back</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primaryAccent }]}
          onPress={() => setShowEditModal(true)}
        >
          <Text style={styles.actionBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        {showAddButton && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
            onPress={() => onAddTerm?.()}
          >
            <Text style={styles.actionBtnText}>➕ Add</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
          onPress={() => onDelete(index)}
        >
          <Text style={styles.actionBtnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={[styles.modalCancel, { color: theme.textTertiary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Term</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={[styles.modalSave, { color: theme.primaryAccent }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.text }]}>Term</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.secondary },
                ]}
                placeholder="Enter term"
                placeholderTextColor={theme.textTertiary}
                value={editTerm}
                onChangeText={setEditTerm}
                multiline
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.text }]}>Definition</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.defInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.secondary },
                ]}
                placeholder="Enter definition"
                placeholderTextColor={theme.textTertiary}
                value={editDef}
                onChangeText={setEditDef}
                multiline
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    height: 220,
    marginVertical: 14,
    perspective: 1000,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardBack: {
    backfaceVisibility: 'hidden',
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  flipHint: {
    fontSize: 11,
    marginTop: 16,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCancel: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalSave: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 28,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 80,
  },
  defInput: {
    minHeight: 120,
  },
});
