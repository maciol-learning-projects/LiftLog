import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image
} from "react-native";
import { Exercise, addExerciseToWorkout } from "../services/api";
import { getPrimaryMuscleGroup } from "../utils/muscleGroups";
import { getExerciseImageUrl } from "../utils/images";

interface ExerciseBrowserScreenProps {
  route: any;
  navigation: any;
}

export default function ExerciseBrowserScreen({ route, navigation }: ExerciseBrowserScreenProps) {
  const { workoutId, existingExerciseNames = [] } = route.params;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states for dropdowns
  const [showMuscleGroupModal, setShowMuscleGroupModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  
  // Expanded card state
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);

  // Fetch exercises from website
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch exercises: ${response.status}`);
        }
        const exerciseData = await response.json();
        
        // Map to your interface with correct field names
        const mappedExercises: Exercise[] = exerciseData.map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          force: ex.force,
          level: ex.level,
          mechanic: ex.mechanic,
          equipment: ex.equipment,
          primaryMuscles: ex.primaryMuscles || [],
          secondaryMuscles: ex.secondaryMuscles || [],
          instructions: ex.instructions || [],
          category: ex.category,
          images: ex.images || [],
          sets: [],
        }));
        
        setExercises(mappedExercises);
        setFilteredExercises(mappedExercises);
      } catch (err: any) {
        setError(err.message);
        Alert.alert("Error", "Failed to load exercises");
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // Get unique values for filters from the fetched data
  const muscleGroups = [...new Set(exercises.map(ex => getPrimaryMuscleGroup(ex)))].sort();
  const equipmentTypes = [...new Set(exercises.map(ex => ex.equipment))];
  const levels = [...new Set(exercises.map(ex => ex.level))];

  // Apply filters
  useEffect(() => {
    if (exercises.length === 0) return;

    let filtered = [...exercises];

    if (searchQuery) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (muscleGroupFilter) {
      filtered = filtered.filter(ex => getPrimaryMuscleGroup(ex) === muscleGroupFilter);
    }

    if (equipmentFilter) {
      filtered = filtered.filter(ex => ex.equipment === equipmentFilter);
    }

    if (levelFilter) {
      filtered = filtered.filter(ex => ex.level === levelFilter);
    }

    setFilteredExercises(filtered);
  }, [searchQuery, muscleGroupFilter, equipmentFilter, levelFilter, exercises]);

  // Check if exercise is already in workout (just for display, not for blocking)
  const isExerciseInWorkout = (exerciseName: string): boolean => {
    return existingExerciseNames.includes(exerciseName);
  };

  const toggleExerciseSelection = (exerciseName: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseName)
        ? prev.filter(name => name !== exerciseName)
        : [...prev, exerciseName]
    );
  };

  const toggleExerciseExpand = (exerciseId: number) => {
    setExpandedExerciseId(prev => 
      prev === exerciseId ? null : exerciseId
    );
  };

  const handleExercisePress = (exerciseId: number, exerciseName: string) => {
    toggleExerciseExpand(exerciseId);
  };

  const handleAddExercises = async () => {
    try {
      const selectedExerciseObjects = exercises.filter(ex => 
        selectedExercises.includes(ex.name)
      );

      console.log(`🔄 Adding ${selectedExerciseObjects.length} exercises to workout ${workoutId}`);

      const addedExercises = [];
      const errors = [];

      for (const exercise of selectedExerciseObjects) {
        try {
          const addedExercise = await addExerciseToWorkout(workoutId, {
            name: exercise.name,
            muscleGroup: getPrimaryMuscleGroup(exercise),
            equipment: exercise.equipment,
            level: exercise.level
          });
          addedExercises.push(addedExercise);
          console.log(`✅ Added: ${exercise.name}`);
        } catch (err: any) {
          console.error(`❌ Failed to add ${exercise.name}:`, err.message);
          errors.push(`${exercise.name}: ${err.message}`);
        }
      }
      
      let message = "";
      if (addedExercises.length > 0) {
        message += `Successfully added ${addedExercises.length} exercise(s)!`;
      }
      if (errors.length > 0) {
        message += `\n\nFailed to add ${errors.length} exercise(s):\n${errors.join('\n')}`;
      }
      
      Alert.alert(
        "Exercise Addition Complete", 
        message || "No exercises were added.",
        [{ text: "OK", onPress: () => {
          if (addedExercises.length > 0) {
            navigation.navigate("WorkoutDetails", { 
              workoutId,
              refresh: true
            });
          }
        }}]
      );
      
    } catch (err: any) {
      console.error("💥 Error in handleAddExercises:", err);
      Alert.alert("Error", err.message || "Failed to add exercises");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMuscleGroupFilter("");
    setEquipmentFilter("");
    setLevelFilter("");
    setExpandedExerciseId(null);
  };

  // Render exercise item with expandable functionality
  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isExpanded = expandedExerciseId === item.id;
    const isSelected = selectedExercises.includes(item.name);
    const isAlreadyInWorkout = isExerciseInWorkout(item.name);
    const imageUrl = getExerciseImageUrl(item);

    return (
      <TouchableOpacity
        style={[
          styles.exerciseItem,
          isSelected && styles.selectedExercise,
          isExpanded && styles.expandedExercise,
          isAlreadyInWorkout && styles.existingExercise
        ]}
        onPress={() => handleExercisePress(item.id, item.name)}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <Text style={[
              styles.exerciseName,
              isAlreadyInWorkout && styles.existingExerciseText
            ]}>
              {item.name}
              {isAlreadyInWorkout && " (in workout)"}
            </Text>
            <View style={styles.exerciseDetails}>
              <Text style={styles.exerciseDetail}>{getPrimaryMuscleGroup(item)}</Text>
              <Text style={styles.exerciseDetail}>{item.equipment}</Text>
              <Text style={styles.exerciseDetail}>{item.level}</Text>
            </View>
          </View>
          <View style={styles.exerciseActions}>
            <Text style={styles.selectionIndicator}>
              {isSelected ? "✓" : ""}
            </Text>
            <Text style={styles.expandIndicator}>
              {isExpanded ? "▲" : "▼"}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Exercise Image */}
            {imageUrl ? (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.exerciseImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image Available</Text>
              </View>
            )}
            
            {/* Additional Exercise Details */}
            <View style={styles.exerciseDescription}>
              <Text style={styles.descriptionText}>
                <Text style={styles.label}>Muscle Group: </Text>
                {getPrimaryMuscleGroup(item)}
              </Text>
              <Text style={styles.descriptionText}>
                <Text style={styles.label}>Primary Muscles: </Text>
                {item.primaryMuscles.join(', ')}
              </Text>
              <Text style={styles.descriptionText}>
                <Text style={styles.label}>Equipment: </Text>
                {item.equipment}
              </Text>
              <Text style={styles.descriptionText}>
                <Text style={styles.label}>Level: </Text>
                {item.level}
              </Text>
              {item.secondaryMuscles.length > 0 && (
                <Text style={styles.descriptionText}>
                  <Text style={styles.label}>Secondary Muscles: </Text>
                  {item.secondaryMuscles.join(', ')}
                </Text>
              )}
              {isAlreadyInWorkout && (
                <Text style={styles.alreadyInWorkoutText}>
                  ⓘ This exercise is already in your workout
                </Text>
              )}
            </View>

            {/* Select Button */}
            <TouchableOpacity
              style={[
                styles.selectButton,
                isSelected && styles.deselectButton
              ]}
              onPress={() => toggleExerciseSelection(item.name)}
            >
              <Text style={styles.selectButtonText}>
                {isSelected ? "Remove from Selection" : "Add to Selection"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Modal component for dropdowns
  const renderModal = (
    visible: boolean, 
    onClose: () => void, 
    options: string[], 
    onSelect: (value: string) => void,
    title: string
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScrollView}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                onSelect("");
                onClose();
              }}
            >
              <Text style={styles.modalOptionText}>All</Text>
            </TouchableOpacity>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading exercises...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Exercises</Text>

      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Compact Filter Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowMuscleGroupModal(true)}
        >
          <Text style={styles.filterButtonText}>
            {muscleGroupFilter || "Muscle Group"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowEquipmentModal(true)}
        >
          <Text style={styles.filterButtonText}>
            {equipmentFilter || "Equipment"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowLevelModal(true)}
        >
          <Text style={styles.filterButtonText}>
            {levelFilter || "Level"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clear Filters Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
        <Text style={styles.clearButtonText}>Clear Filters</Text>
      </TouchableOpacity>

      {/* Exercise Count */}
      <Text style={styles.resultCount}>
        Showing {filteredExercises.length} of {exercises.length} exercises
        {existingExerciseNames.length > 0 && ` • ${existingExerciseNames.length} already in workout`}
      </Text>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExerciseItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No exercises found</Text>
        }
      />

      {/* Add Button - Only show if there are selected exercises */}
      {selectedExercises.length > 0 && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddExercises}>
          <Text style={styles.addButtonText}>
            Add {selectedExercises.length} Exercise(s)
          </Text>
        </TouchableOpacity>
      )}

      {/* Modals */}
      {renderModal(
        showMuscleGroupModal,
        () => setShowMuscleGroupModal(false),
        muscleGroups,
        setMuscleGroupFilter,
        "Select Muscle Group"
      )}

      {renderModal(
        showEquipmentModal,
        () => setShowEquipmentModal(false),
        equipmentTypes,
        setEquipmentFilter,
        "Select Equipment"
      )}

      {renderModal(
        showLevelModal,
        () => setShowLevelModal(false),
        levels,
        setLevelFilter,
        "Select Level"
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centerContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    padding: 16 
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  clearButton: { 
    backgroundColor: "#f8f9fa", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  clearButtonText: { fontWeight: "bold", color: "#6c757d" },
  resultCount: { 
    fontSize: 14, 
    color: "#666", 
    marginBottom: 16,
    textAlign: "center" 
  },
  exerciseItem: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
    padding: 16,
  },
  selectedExercise: {
    backgroundColor: "#e6f7ff",
    borderColor: "#1890ff",
  },
  expandedExercise: {
    backgroundColor: "#f8f9fa",
  },
  existingExercise: {
    backgroundColor: "#f8f9fa",
    borderColor: "#d9d9d9",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: { 
    fontSize: 16, 
    fontWeight: "500", 
    marginBottom: 4 
  },
  existingExerciseText: {
    color: "#666",
  },
  exerciseDetails: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  exerciseDetail: { 
    fontSize: 12, 
    color: "#666",
    marginHorizontal: 2 
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectionIndicator: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#1890ff",
    width: 20,
    textAlign: "center",
  },
  expandIndicator: {
    fontSize: 12,
    color: "#666",
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#666',
    fontStyle: 'italic',
  },
  exerciseDescription: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  alreadyInWorkoutText: {
    fontSize: 14,
    color: '#1890ff',
    fontStyle: 'italic',
    marginTop: 8,
  },
  selectButton: {
    backgroundColor: '#1890ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deselectButton: {
    backgroundColor: '#ff4d4f',
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#1890ff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: { 
    color: "white", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  errorText: { 
    color: "red", 
    textAlign: "center", 
    marginBottom: 16 
  },
  retryButton: {
    backgroundColor: "#1890ff",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#1890ff",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});