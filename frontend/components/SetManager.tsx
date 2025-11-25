// frontend/components/SetManager.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Exercise, Set, createSet, updateSet, deleteSet } from '../services/api';

interface SetManagerProps {
  exercise: Exercise;
  onSetsUpdate: () => void;
}

export default function SetManager({ exercise, onSetsUpdate }: SetManagerProps) {
  const [editingSet, setEditingSet] = useState<Set | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddSet = async () => {
    try {
      await createSet({
        exerciseId: exercise.id,
        reps: parseInt(reps) || 0,
        weight: parseFloat(weight) || 0,
        notes: notes,
      });
      setReps('');
      setWeight('');
      setNotes('');
      setModalVisible(false);
      onSetsUpdate();
      Alert.alert('Success', 'Set added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add set');
    }
  };

  const handleUpdateSet = async (setId: number, updates: Partial<Set>) => {
    try {
      await updateSet(setId, updates);
      onSetsUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to update set');
    }
  };

  const handleDeleteSet = async (setId: number) => {
    Alert.alert(
      'Delete Set',
      'Are you sure you want to delete this set?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSet(setId);
              onSetsUpdate();
              Alert.alert('Success', 'Set deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete set');
            }
          },
        },
      ]
    );
  };

  const openAddSetModal = () => {
    setEditingSet(null);
    setReps('8');
    setWeight('0');
    setNotes('');
    setModalVisible(true);
  };

  const openEditSetModal = (set: Set) => {
    setEditingSet(set);
    setReps(set.reps.toString());
    setWeight(set.weight?.toString() || '0');
    setNotes(set.notes || '');
    setModalVisible(true);
  };

  const handleSaveSet = async () => {
    if (editingSet) {
      await handleUpdateSet(editingSet.id, {
        reps: parseInt(reps) || 0,
        weight: parseFloat(weight) || 0,
        notes: notes,
      });
    } else {
      await handleAddSet();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sets</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddSetModal}>
          <Text style={styles.addButtonText}>+ Add Set</Text>
        </TouchableOpacity>
      </View>

      {exercise.sets?.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <View style={styles.setInfo}>
            <Text style={styles.setNumber}>Set {index + 1}</Text>
            <View style={styles.setDetails}>
              <TextInput
                style={styles.input}
                value={set.reps.toString()}
                keyboardType="numeric"
                onChangeText={(value) => 
                  handleUpdateSet(set.id, { reps: parseInt(value) || 0 })
                }
              />
              <Text style={styles.label}>reps</Text>
              
              <TextInput
                style={styles.input}
                value={set.weight?.toString() || '0'}
                keyboardType="numeric"
                onChangeText={(value) => 
                  handleUpdateSet(set.id, { weight: parseFloat(value) || 0 })
                }
              />
              <Text style={styles.label}>kg</Text>
            </View>
            {set.notes ? (
              <Text style={styles.notesPreview} numberOfLines={1}>
                📝 {set.notes}
              </Text>
            ) : null}
          </View>
          
          <View style={styles.setActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => openEditSetModal(set)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteSet(set.id)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Add/Edit Set Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSet ? 'Edit Set' : 'Add New Set'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.modalInput}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                placeholder="Number of reps"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.modalInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Weight in kg"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Add notes about this set..."
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSet}
              >
                <Text style={styles.saveButtonText}>
                  {editingSet ? 'Update' : 'Add'} Set
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1890ff',
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  setInfo: {
    flex: 1,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  setDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 4,
    width: 50,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  label: {
    fontSize: 12,
    color: '#6c757d',
    marginHorizontal: 4,
  },
  notesPreview: {
    fontSize: 12,
    color: '#1890ff',
    fontStyle: 'italic',
  },
  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e7f3ff',
    borderRadius: 4,
  },
  editButtonText: {
    color: '#1890ff',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#495057',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 6,
    padding: 12,
    backgroundColor: 'white',
  },
  notesInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#1890ff',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});