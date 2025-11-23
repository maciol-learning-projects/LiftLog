// In WorkoutListScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, TextInput, StyleSheet, Alert } from "react-native";
import { fetchWorkouts, createWorkout, Workout } from "../services/api";

const USER_ID = "c9abf80e-18ae-4624-ba3d-d069b29157d3"; // Make sure this user exists in your database!

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
      const data = await fetchWorkouts(USER_ID);
      console.log("Workouts loaded:", data);
      setWorkouts(data);
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>
              {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
            </Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            <Text style={styles.exerciseCount}>
              {item.exercises?.length || 0} exercises
            </Text>
            <Button
              title="View"
              onPress={() => navigation.navigate("WorkoutDetails", { workoutId: item.id })}
            />
          </View>
        )}
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
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  card: { padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 8 },
  name: { fontSize: 18, fontWeight: "500" },
  date: { fontSize: 14, color: "#666" },
  notes: { fontSize: 14, fontStyle: "italic" },
  exerciseCount: { fontSize: 12, color: "#888" },
  inputContainer: { flexDirection: "row", marginTop: 16, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 8, marginRight: 8, borderRadius: 8 },
  empty: { textAlign: "center", color: "#666", marginTop: 20 },
});