// In WorkoutListScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, TextInput, StyleSheet, Alert, TouchableOpacity  } from "react-native";
import { fetchWorkouts, createWorkout } from "../services/api";
import { Workout } from "../../shared/types";
import { WorkoutStatus } from "../utils/workoutStatus";

const USER_ID = "4d378dda-8f92-4c4a-8e2d-659eff84f038"; // Make sure this user exists in your database!

interface WorkoutListScreenProps {
  navigation?: any; // or use proper type from React Navigation
}

export default function WorkoutListScreen({ navigation }: WorkoutListScreenProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState("");

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      console.log("Loading workouts for user:", USER_ID);
      const allWorkouts = await fetchWorkouts(USER_ID);
      // Filter out completed workouts - only show DRAFT and IN_PROGRESS
      const activeWorkouts = allWorkouts.filter(
        workout => workout.status === WorkoutStatus.DRAFT || workout.status === WorkoutStatus.IN_PROGRESS
      );
      console.log("Active workouts loaded:", activeWorkouts);
      setWorkouts(activeWorkouts);
    } catch (err: any) {
      console.error("Error loading workouts:", err);
      Alert.alert("Error", err.message || "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async () => {
    if (!newWorkoutName.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return;
    }
    
    try {
      await createWorkout(newWorkoutName, USER_ID);
      setNewWorkoutName("");
      await loadWorkouts(); // refresh list
    } catch (err: any) {
      console.error("Error creating workout:", err);
      Alert.alert("Error", err.message || "Failed to create workout");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: WorkoutStatus) => {
    switch (status) {
      case WorkoutStatus.IN_PROGRESS:
        return { text: 'In Progress', color: '#1890ff' };
      case WorkoutStatus.COMPLETED:
        return { text: 'Completed', color: '#28a745' };
      default:
        return { text: 'Planned', color: '#6c757d' };
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts</Text>
      
      {loading && <Text>Loading...</Text>}
      
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const status = getStatusBadge(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.statusText}>{status.text}</Text>
                </View>
              </View>
              
              <Text style={styles.date}>
                {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
              </Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              
              <View style={styles.workoutDetails}>
                <Text style={styles.exerciseCount}>
                  {item.exercises?.length || 0} exercises
                </Text>
                {item.duration && (
                  <Text style={styles.duration}>
                    Duration: {formatTime(item.duration)}
                  </Text>
                )}
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => navigation.navigate("WorkoutDetails", { workoutId: item.id })}
                >
                  <Text style={styles.viewButtonText}>View/Edit</Text>
                </TouchableOpacity>
                
                {(item.status === WorkoutStatus.DRAFT || item.status === WorkoutStatus.IN_PROGRESS) && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => navigation.navigate("ActiveWorkout", { workout: item })}
                  >
                    <Text style={styles.startButtonText}>
                      {item.status === WorkoutStatus.IN_PROGRESS ? 'Resume' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No workouts found</Text> : null
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New workout name"
          value={newWorkoutName}
          onChangeText={setNewWorkoutName}
        />
        <Button title="Add Workout" onPress={handleAddWorkout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#212529" },
  card: { 
    padding: 16, 
    backgroundColor: "white",
    borderWidth: 1, 
    borderColor: "#e9ecef", 
    borderRadius: 12, 
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: { fontSize: 18, fontWeight: "600", color: "#212529", flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  date: { fontSize: 14, color: "#6c757d", marginBottom: 4 },
  notes: { fontSize: 14, fontStyle: "italic", color: "#6c757d", marginBottom: 8 },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseCount: { fontSize: 12, color: "#495057" },
  duration: { fontSize: 12, color: "#495057" },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#6c757d",
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  startButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#28a745",
    borderRadius: 8,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  inputContainer: { 
    flexDirection: "row", 
    marginTop: 16, 
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: "#e9ecef", 
    padding: 12, 
    marginRight: 8, 
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  empty: { textAlign: "center", color: "#6c757d", marginTop: 20 },
});