// screens/ActiveWorkoutScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { completeSet, completeWorkout, startWorkout, resetWorkout } from '../services/api';
import { Workout, Exercise, Set} from '../../shared/types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://192.168.2.33:3000";

interface ActiveWorkoutScreenProps {
  route: {
    params: {
      workout: Workout;
    };
  };
  navigation: any;
}

export default function ActiveWorkoutScreen({ route, navigation }: ActiveWorkoutScreenProps) {
  const { workout: initialWorkout } = route.params;
  const [workout, setWorkout] = useState<Workout>(initialWorkout);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSet, setSelectedSet] = useState<Set | null>(null);
  const [setNotes, setSetNotes] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle back button press
  // usePreventRemove(
  //   workout.status === 'IN_PROGRESS', // Only prevent if workout is active
  //   ({ data }) => {
  //       Alert.alert(
  //       'Cancel Workout?',
  //       'Going back will reset your current workout progress.',
  //       [
  //           { text: "Stay", style: "cancel" },
  //           {
  //           text: "Reset Workout",
  //           style: "destructive",
  //           onPress: async () => {
  //               try {
  //               await resetWorkout(workout.id);
  //               console.log('✅ Workout reset successfully');
  //               navigation.dispatch(data.action);
  //               } catch (error) {
  //               console.error('❌ Failed to reset workout:', error);
  //               navigation.dispatch(data.action);
  //               }
  //           },
  //           },
  //       ]
  //       );
  //   }
  // );

  // Ensure workout is properly started
  useEffect(() => {
    const ensureWorkoutStarted = async () => {
      if (workout.status !== 'IN_PROGRESS' || !workout.startedAt) {
        console.log('🔄 Workout not properly started, starting now...');
        try {
          const updatedWorkout = await startWorkout(workout.id);
          setWorkout(updatedWorkout);
          console.log('✅ Workout started with startedAt:', updatedWorkout.startedAt);
        } catch (error) {
          console.error('❌ Failed to start workout:', error);
        }
      } else {
        console.log('✅ Workout already started at:', workout.startedAt);
      }
    };

    ensureWorkoutStarted();
  }, [workout.id, workout.status, workout.startedAt]);

  // Timer for workout duration
  useEffect(() => {
    // Calculate initial elapsed time based on startedAt
    if (workout.startedAt) {
      const startedAt = new Date(workout.startedAt).getTime();
      const now = Date.now();
      const initialElapsed = Math.floor((now - startedAt) / 1000);
      setElapsedTime(initialElapsed);
      console.log('⏱️ Initial elapsed time from startedAt:', initialElapsed, 'seconds');
    } else {
      console.log('⚠️ No startedAt, starting timer from 0');
      setElapsedTime(0);
    }

    // Start the timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    };
  }, [workout.startedAt]);

  // Rest Timer
  useEffect(() => {
    if (restTimer === null) return;

    if (restTimer > 0) {
      restTimerRef.current = setTimeout(() => {
        setRestTimer(restTimer - 1);
      }, 1000);
    } else {
      setIsResting(false);
      setRestTimer(null);
      Alert.alert('Rest Time Over', 'Ready for your next set?');
    }

    return () => {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    };
  }, [restTimer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = async (set: Set) => {
    try {
      await completeSet(set.id);
      
      // Update local state
      const updatedExercises = workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets?.map(s => 
          s.id === set.id ? { ...s, completed: true, completedAt: new Date().toISOString() } : s
        ) || [],
      }));

      setWorkout({ ...workout, exercises: updatedExercises });
      
      // Start rest timer (90 seconds default)
      setRestTimer(90);
      setIsResting(true);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to complete set');
    }
  };

  const handleAddNotes = (set: Set) => {
    setSelectedSet(set);
    setSetNotes(set.notes || '');
    setModalVisible(true);
  };

  const saveNotes = async () => {
    if (!selectedSet) return;

    try {
      // Update local state for now
      const updatedExercises = workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets?.map(s => 
          s.id === selectedSet.id ? { ...s, notes: setNotes } : s
        ) || [],
      }));

      setWorkout({ ...workout, exercises: updatedExercises });
      setModalVisible(false);
      Alert.alert('Success', 'Notes saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  const handleCompleteWorkout = async () => {
    console.log('🎯 Complete workout button pressed');

    // Check if there are any uncompleted sets
    const hasUncompletedSets = workout.exercises.some(exercise => 
        exercise.sets?.some(set => !set.completed)
    );
    const uncompletedCount = workout.exercises.reduce((total, exercise) => 
    total + (exercise.sets?.filter(set => !set.completed).length || 0), 0
    );

    if (hasUncompletedSets) {
    Alert.alert(
        'Uncompleted Sets',
        `You have ${uncompletedCount} uncompleted sets. Are you sure you want to finish the workout?`,
        [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Complete Anyway', style: 'destructive', onPress: completeWorkoutProcess }
        ]
    );
    } else {
        // All sets completed, proceed normally
        completeWorkoutProcess();
    }
    };

// Separate function for the actual completion process
const completeWorkoutProcess = async () => {
  console.log('📋 Workout data:', {
    id: workout.id,
    name: workout.name,
    status: workout.status,
    startedAt: workout.startedAt,
    elapsedTime: elapsedTime,
    exercises: workout.exercises?.length,
    totalSets: workout.exercises?.reduce((total, ex) => total + (ex.sets?.length || 0), 0),
    completedSets: workout.exercises?.reduce((total, ex) => total + (ex.sets?.filter(set => set.completed).length || 0), 0)
  });

  Alert.alert(
    'Complete Workout',
    'Are you sure you want to finish this workout?',
    [
      { text: 'Cancel', style: 'cancel', onPress: () => console.log('❌ Complete workout cancelled') },
      {
        text: 'Complete',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🚀 Starting workout completion...');
            console.log('📞 Calling API with elapsedTime:', elapsedTime);
            
            // Send elapsedTime to backend
            const result = await completeWorkout(workout.id, elapsedTime);
            console.log('✅ Workout completion successful:', result);
            
            // Check if we got a proper resetWorkout (should be DRAFT status)
            if (result.resetWorkout.status === 'DRAFT') {
              console.log('✅ Workout was properly reset to DRAFT');
            } else {
              console.warn('⚠️ Workout was not reset to DRAFT:', result.resetWorkout.status);
            }
            
            Alert.alert(
              'Workout Completed!',
              `Great job! 🎉\n\nWorkout duration: ${formatTime(result.sessionData.duration)}\nCompleted sets: ${result.sessionData.completedSets}/${result.sessionData.totalSets}`,
              [
                {
                  text: 'View History',
                  onPress: () => {
                    // First navigate to History, then reset the stack
                    navigation.navigate('WorkoutHistory');
                    // Reset the stack so back goes to Home, not ActiveWorkout
                    navigation.reset({
                      index: 1, // This keeps WorkoutHistory as current, Home as previous
                      routes: [
                        { name: 'Home' },
                        { name: 'WorkoutHistory' }
                      ],
                    });
                  },
                },
                {
                  text: 'Back to Workouts',
                  onPress: () => {
                    // First navigate to Workouts, then reset the stack
                    navigation.navigate('Workouts');
                    // Reset the stack so back goes to Home, not ActiveWorkout
                    navigation.reset({
                      index: 1, // This keeps Workouts as current, Home as previous
                      routes: [
                        { name: 'Home' },
                        { name: 'Workouts' }
                      ],
                    });
                  },
                },
              ]
            );
          } catch (error) {
            console.error('💥 Complete workout error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            Alert.alert('Error', `Failed to complete workout: ${errorMessage}`);
          }
        },
      },
    ]
  );
};

  const handleCancelWorkout = () => {
    navigation.goBack();
  };

  const skipRestTimer = () => {
    setRestTimer(null);
    setIsResting(false);
    if (restTimerRef.current) clearTimeout(restTimerRef.current);
  };

  const getCompletedSetsCount = (exercise: Exercise): number => {
    return exercise.sets?.filter(set => set.completed).length || 0;
  };

  return (
    <View style={styles.container}>
      {/* Header with Timer */}
      <View style={styles.header}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        <Text style={styles.timerLabel}>Workout Time</Text>
      </View>

      {/* Rest Timer Overlay */}
      {isResting && (
        <View style={styles.restTimerOverlay}>
          <Text style={styles.restTimerTitle}>REST TIME</Text>
          <Text style={styles.restTimer}>{formatTime(restTimer || 0)}</Text>
          <Text style={styles.restTimerSubtitle}>Next set ready in...</Text>
          <TouchableOpacity style={styles.skipButton} onPress={skipRestTimer}>
            <Text style={styles.skipButtonText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {workout.exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseProgress}>
                {getCompletedSetsCount(exercise)}/{exercise.sets?.length || 0} sets completed
              </Text>
            </View>
            
            {exercise.sets?.map((set, setIndex) => (
              <View key={set.id} style={[
                styles.setRow,
                set.completed && styles.completedSet
              ]}>
                <View style={styles.setInfo}>
                  <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                  <Text style={styles.setDetails}>
                    {set.reps} reps × {set.weight || 0} kg
                  </Text>
                  {set.notes ? (
                    <Text style={styles.notesPreview} numberOfLines={1}>
                      📝 {set.notes}
                    </Text>
                  ) : null}
                </View>
                
                <View style={styles.setActions}>
                  {!set.completed ? (
                    <>
                      <TouchableOpacity 
                        style={styles.notesButton}
                        onPress={() => handleAddNotes(set)}
                      >
                        <Text style={styles.notesButtonText}>📝</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.completeButton}
                        onPress={() => handleCompleteSet(set)}
                      >
                        <Text style={styles.completeButtonText}>✓</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.completedText}>Completed</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Footer with Cancel and Complete Buttons */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelWorkout}
          >
            <Text style={styles.cancelButtonText}>Cancel Workout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.completeWorkoutButton}
            onPress={handleCompleteWorkout}
          >
            <Text style={styles.completeWorkoutButtonText}>Complete Workout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Notes</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              placeholder="Add notes about this set (how it felt, technique, etc.)"
              value={setNotes}
              onChangeText={setSetNotes}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNotes}
              >
                <Text style={styles.saveButtonText}>Save Notes</Text>
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
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  timer: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1890ff',
  },
  timerLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  exerciseProgress: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  completedSet: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  setInfo: {
    flex: 1,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  setDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
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
  notesButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#e7f3ff',
  },
  notesButtonText: {
    fontSize: 16,
  },
  completeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#28a745',
    minWidth: 40,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  completedText: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  completeWorkoutButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeWorkoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  restTimerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  restTimerTitle: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
    marginBottom: 20,
  },
  restTimer: {
    fontSize: 72,
    color: '#1890ff',
    fontWeight: '700',
    marginBottom: 10,
  },
  restTimerSubtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 30,
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  skipButtonText: {
    color: 'white',
    fontWeight: '600',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#1890ff',
  },
  modalCancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});