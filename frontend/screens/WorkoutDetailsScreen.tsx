import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions
} from "react-native";
import { fetchWorkoutById, Workout, Exercise, removeExerciseFromWorkout, updateExerciseOrder } from "../services/api";
import { getExerciseImageUrl } from "../utils/images";

interface WorkoutDetailScreenProps {
  route: {
    params: {
      workoutId: number;
      refresh?: boolean;
    };
  };
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WorkoutDetailScreen({ route, navigation }: WorkoutDetailScreenProps) {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);

  // Drag state
  const [dragging, setDragging] = useState<{
    id: number;
    startIndex: number;
    index: number;
    startY: number;
  } | null>(null);
  const [visualExercises, setVisualExercises] = useState<Exercise[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [dragOffset, setDragOffset] = useState(0); // New state for drag offset

  const panRefs = useRef<{ [key: number]: Animated.ValueXY }>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const loadWorkout = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWorkoutById(workoutId);
      setWorkout(data);
      setVisualExercises(data.exercises);
    } catch (err) {
      console.error("Failed to load workout:", err);
      Alert.alert("Error", "Failed to load workout details");
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  const handleRemoveExercise = useCallback((exerciseId: number, exerciseName: string) => {
    Alert.alert(
      "Remove Exercise",
      `Are you sure you want to remove "${exerciseName}" from this workout?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => removeExercise(exerciseId) 
        }
      ]
    );
  }, []);

  const removeExercise = async (exerciseId: number) => {
    try {
      await removeExerciseFromWorkout(exerciseId);
      await loadWorkout();
      Alert.alert("Success", "Exercise removed from workout");
    } catch (err) {
      console.error("Failed to remove exercise:", err);
      Alert.alert("Error", "Failed to remove exercise from workout");
    }
  };

  const toggleExerciseExpand = useCallback((exerciseId: number) => {
    if (dragging) return;
    setExpandedExerciseId(prev => prev === exerciseId ? null : exerciseId);
  }, [dragging]);

  const moveExercise = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!workout || fromIndex === toIndex) return;

    const newExercises = [...workout.exercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);

    setWorkout({
      ...workout,
      exercises: newExercises
    });
    setVisualExercises(newExercises);

    try {
      await updateExerciseOrder(workoutId, newExercises.map((ex, index) => ({
        id: ex.id,
        order: index
      })));
    } catch (err) {
      console.error("Failed to update exercise order:", err);
      await loadWorkout();
    }
  }, [workout, workoutId, loadWorkout]);

  const handleAddExercises = useCallback(() => {
    navigation.navigate("ExerciseBrowser", { 
      workoutId: workoutId,
      existingExerciseNames: workout?.exercises.map(ex => ex.name) || []
    });
  }, [navigation, workoutId, workout]);

  const createPanResponder = (exercise: Exercise, index: number) => {
    const pan = panRefs.current[exercise.id] || new Animated.ValueXY();
    panRefs.current[exercise.id] = pan;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true, 
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false, // Don't move on the whole card
      onMoveShouldSetPanResponderCapture: () => false,
      
      // Only activate when the drag handle is pressed
      onPanResponderTerminationRequest: () => true,
      
      onPanResponderGrant: (_, gestureState) => {
        console.log("🔄 Drag started for:", exercise.name);
        setDragging({
          id: exercise.id,
          index,
          startIndex: index,
          startY: gestureState.y0
        });
        setDragOffset(0); // Reset offset
        setScrollEnabled(false);
        setExpandedExerciseId(null);
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gestureState) => {
        if (!dragging || dragging.id !== exercise.id) return;

        const dragY = gestureState.moveY - dragging.startY;
        
        // Apply the accumulated offset
        const totalDragY = dragY + dragOffset;
        pan.setValue({ x: 0, y: totalDragY });

        // Calculate which position we're hovering over
        const itemHeight = 120;
        const headerOffset = 200;
        const relativeY = gestureState.moveY - headerOffset;
        
        let hoverIndex = Math.floor(relativeY / itemHeight);
        hoverIndex = Math.max(0, Math.min(workout!.exercises.length - 1, hoverIndex));

        // If we're dragging over a different item, swap positions visually
        if (hoverIndex !== dragging.index && hoverIndex !== -1) {
          const newVisualOrder = [...visualExercises];
          const currentDragIndex = dragging.index;
          
          // Remove the dragged item temporarily
          const [draggedItem] = newVisualOrder.splice(currentDragIndex, 1);
          // Insert it at the hover position
          newVisualOrder.splice(hoverIndex, 0, draggedItem);
          
          setVisualExercises(newVisualOrder);
          
          // Calculate and store the offset for the position change
          const positionChange = hoverIndex - currentDragIndex;
          const newOffset = dragOffset - (positionChange * itemHeight);
          setDragOffset(newOffset);
          
          // Update dragging index to new position
          setDragging(prev => prev ? { ...prev, index: hoverIndex } : null);
        }

        // Auto-scroll when near edges
        if (gestureState.moveY < 150) {
          scrollViewRef.current?.scrollTo({ y: Math.max(0, gestureState.moveY - 200), animated: true });
        } else if (gestureState.moveY > SCREEN_HEIGHT - 150) {
          scrollViewRef.current?.scrollTo({ y: gestureState.moveY - 100, animated: true });
        }
      },

      onPanResponderRelease: () => {
        console.log("🔄 Drag ended");
        
        // Finalize the reorder
        if (dragging && dragging.index !== dragging.startIndex) {
          moveExercise(dragging.startIndex, dragging.index);
        }

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start(() => {
          setDragging(null);
          setDragOffset(0); // Reset offset
          setScrollEnabled(true);
        });
      },

      onPanResponderTerminate: () => {
        // Reset to original order if drag is cancelled
        if (workout) {
          setVisualExercises([...workout.exercises]);
        }
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start(() => {
          setDragging(null);
          setDragOffset(0); // Reset offset
          setScrollEnabled(true);
        });
      },
    });
  };

  const renderExerciseItem = useCallback((exercise: Exercise, index: number) => {
    const isExpanded = expandedExerciseId === exercise.id;
    const isDragging = dragging?.id === exercise.id;
    const isPlaceholder = !isDragging && visualExercises[index]?.id !== exercise.id;
    
    const imageUrl = getExerciseImageUrl(exercise);
    const exerciseCount = visualExercises.length;

    const pan = panRefs.current[exercise.id] || new Animated.ValueXY();

    const animatedStyle = {
      transform: pan.getTranslateTransform(),
      zIndex: isDragging ? 999 : 1,
      opacity: isDragging ? 0.9 : (isPlaceholder ? 0.3 : 1),
    };

    // If this is a placeholder (item that was swapped out), show empty space
    if (isPlaceholder) {
      return (
        <View key={`placeholder-${index}`} style={[styles.exerciseCard, styles.placeholderCard]}>
          <Text style={styles.placeholderText}>Drop here</Text>
        </View>
      );
    }

    return (
      <Animated.View
        key={exercise.id}
        style={[
          styles.exerciseCard,
          isDragging && styles.draggingCard,
          animatedStyle
        ]}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            {/* Drag Handle */}
            <View style={[
              styles.dragHandle,
              isDragging && styles.dragHandleActive
            ]}{...createPanResponder(exercise, index).panHandlers}
            >
              <Text style={[
                styles.dragHandleText,
                isDragging && styles.dragHandleTextActive
              ]}>≡</Text>
            </View>
            
            <TouchableOpacity
              style={styles.exerciseContent}
              onPress={() => toggleExerciseExpand(exercise.id)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseTextContainer}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets?.length || 0} sets • {exercise.equipment || "Bodyweight"}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveExercise(exercise.id, exercise.name)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={() => toggleExerciseExpand(exercise.id)}>
            <Text style={styles.expandIndicator}>
              {isExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Exercise Image */}
            {imageUrl ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.exerciseImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image Available</Text>
              </View>
            )}
            
            {/* Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 ? (
              <View style={styles.instructionsContainer}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {exercise.instructions.map((instruction, idx) => (
                  <Text key={idx} style={styles.instructionText}>
                    {idx + 1}. {instruction}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No instructions available</Text>
              </View>
            )}

            {/* Sets Information */}
            {exercise.sets && exercise.sets.length > 0 ? (
              <View style={styles.setsContainer}>
                <Text style={styles.sectionTitle}>Sets</Text>
                {exercise.sets.map((set, idx) => (
                  <Text key={set.id} style={styles.setText}>
                    Set {idx + 1}: {set.reps} reps {set.weight ? `with ${set.weight}kg` : '(body weight)'}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No sets added yet</Text>
              </View>
            )}

            {/* Exercise Metadata */}
            <View style={styles.metadataContainer}>
              <Text style={styles.sectionTitle}>Exercise Details</Text>
              <View style={styles.metadataGrid}>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Level</Text>
                  <Text style={styles.metadataValue}>{exercise.level || "Not specified"}</Text>
                </View>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Force</Text>
                  <Text style={styles.metadataValue}>{exercise.force || "Not specified"}</Text>
                </View>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Mechanic</Text>
                  <Text style={styles.metadataValue}>{exercise.mechanic || "Not specified"}</Text>
                </View>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Category</Text>
                  <Text style={styles.metadataValue}>{exercise.category || "Not specified"}</Text>
                </View>
              </View>
            </View>

            {/* Reorder Controls */}
            <View style={styles.reorderContainer}>
              <Text style={styles.sectionTitle}>Reorder Exercise</Text>
              <View style={styles.reorderButtons}>
                <TouchableOpacity
                  style={[
                    styles.reorderButton,
                    index === 0 && styles.reorderButtonDisabled
                  ]}
                  onPress={() => moveExercise(index, index - 1)}
                  disabled={index === 0}
                >
                  <Text style={styles.reorderButtonText}>↑ Move Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reorderButton,
                    index === exerciseCount - 1 && styles.reorderButtonDisabled
                  ]}
                  onPress={() => moveExercise(index, index + 1)}
                  disabled={index === exerciseCount - 1}
                >
                  <Text style={styles.reorderButtonText}>↓ Move Down</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Drag Instructions */}
            <View style={styles.dragInstructions}>
              <Text style={styles.dragHint}>
                🎯 Press and hold the ≡ symbol to drag and reorder
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  }, [workout, expandedExerciseId, dragging, visualExercises, toggleExerciseExpand, handleRemoveExercise, moveExercise, dragOffset]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout, route.params?.refresh]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWorkout}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workout.name}</Text>
        {workout.notes && (
          <Text style={styles.notes}>{workout.notes}</Text>
        )}
        <Text style={styles.exerciseCount}>
          {visualExercises.length} exercise{visualExercises.length !== 1 ? 's' : ''}
        </Text>
        
        {/* Drag Instructions Header */}
        <View style={styles.dragHeaderInstructions}>
          <Text style={styles.dragHeaderText}>
            💡 Press and hold the ≡ symbol on any exercise to drag and reorder
          </Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {visualExercises.length > 0 ? (
          visualExercises.map((exercise, index) => renderExerciseItem(exercise, index))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No exercises yet</Text>
            <Text style={styles.emptyStateText}>
              Add exercises to build your workout routine
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddExercises}
        >
          <Text style={styles.addButtonText}>
            {visualExercises.length === 0 ? "+ Add First Exercise" : "+ Add More Exercises"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa"
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef"
  },
  title: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#212529",
    marginBottom: 4
  },
  notes: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
    fontStyle: "italic"
  },
  exerciseCount: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
    marginBottom: 8,
  },
  dragHeaderInstructions: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  dragHeaderText: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa"
  },
  loadingText: {
    fontSize: 16,
    color: "#6c757d",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: "#495057",
    marginBottom: 16,
    textAlign: "center"
  },
  retryButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16
  },
  exerciseCard: { 
    backgroundColor: "white",
    borderRadius: 12, 
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  draggingCard: {
    shadowColor: "#1890ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: "#f0f8ff",
    borderColor: "#1890ff",
    borderWidth: 1,
  },
  insertionAbove: {
    borderTopWidth: 3,
    borderTopColor: '#1890ff',
    marginTop: 8,
    backgroundColor: '#f8fdff',
  },
  insertionBelow: {
    borderBottomWidth: 3,
    borderBottomColor: '#1890ff', 
    marginBottom: 8,
    backgroundColor: '#f8fdff',
  },
  beingMoved: {
    backgroundColor: '#f0f8ff',
    transform: [{ translateY: 4 }],
  },
  dragHandle: {
    marginRight: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandleActive: {
    backgroundColor: "#e0f7ff",
    borderColor: "#1890ff",
    borderWidth: 1,
  },
  dragHandleText: {
    fontSize: 18,
    color: "#adb5bd",
    fontWeight: "bold",
  },
  dragHandleTextActive: {
    color: "#1890ff",
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  exerciseTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: { 
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 2
  },
  exerciseDetails: {
    fontSize: 13,
    color: "#6c757d",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  expandIndicator: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  imageContainer: {
    marginBottom: 16,
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    color: '#6c757d',
    fontStyle: 'italic',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  instructionsContainer: {
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 6,
    lineHeight: 20,
  },
  setsContainer: {
    marginBottom: 16,
  },
  setText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
    paddingLeft: 8,
  },
  noDataContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  metadataContainer: {
    marginBottom: 16,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  metadataItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: '#495057',
  },
  reorderContainer: {
    marginBottom: 16,
  },
  reorderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reorderButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1890ff',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  reorderButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  dragInstructions: {
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6f7ff',
  },
  dragHint: {
    fontSize: 12,
    color: "#1890ff",
    fontStyle: "italic",
    textAlign: "center",
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  addButton: {
    backgroundColor: "#1890ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#1890ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: { 
    color: "white", 
    fontWeight: "600", 
    fontSize: 16 
  },
   placeholderCard: {
    backgroundColor: '#f8f9fa',
    borderStyle: 'dashed',
    borderColor: '#adb5bd',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
});