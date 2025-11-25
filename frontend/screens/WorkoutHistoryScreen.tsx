// screens/WorkoutHistoryScreen.tsx - UPDATED
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert,
  TouchableOpacity 
} from "react-native";
import { fetchWorkoutHistory } from "../services/api";
import { WorkoutHistory } from "../../shared/types";
import { usePreventRemove } from "@react-navigation/native";

const USER_ID = "4d378dda-8f92-4c4a-8e2d-659eff84f038";

interface WorkoutHistoryScreenProps {
  navigation?: any;
}

export default function WorkoutHistoryScreen({ navigation }: WorkoutHistoryScreenProps) {
  const [workouts, setWorkouts] = useState<WorkoutHistory[]>([]); // Change to WorkoutHistory[]
  const [loading, setLoading] = useState(false);


  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const workoutHistory = await fetchWorkoutHistory(USER_ID);
      setWorkouts(workoutHistory);
    } catch (err: any) {
      console.error("Error loading workout history:", err);
      Alert.alert("Error", err.message || "Failed to load workout history");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      
      {loading && <Text style={styles.loadingText}>Loading...</Text>}
      
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            </View>
            
            <Text style={styles.date}>{formatDate(item.completedAt)}</Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            
            <View style={styles.workoutStats}>
              <Text style={styles.stat}>
                {item.exerciseCount} exercises
              </Text>
              <Text style={styles.stat}>
                {item.completedSets}/{item.totalSets} sets completed
              </Text>
              {item.duration && (
                <Text style={styles.stat}>
                  Duration: {formatTime(item.duration)}
                </Text>
              )}
              <Text style={styles.stat}>
                Completed: {new Date(item.completedAt).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No workout history yet</Text>
              <Text style={styles.emptyText}>
                Complete a workout to see it here!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#212529" },
  loadingText: { textAlign: 'center', color: '#6c757d', marginVertical: 20 },
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
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#28a745',
    borderRadius: 12,
    marginLeft: 8,
  },
  completedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  date: { fontSize: 14, color: "#6c757d", marginBottom: 4 },
  notes: { fontSize: 14, fontStyle: "italic", color: "#6c757d", marginBottom: 8 },
  workoutStats: {
    marginBottom: 12,
  },
  stat: { 
    fontSize: 12, 
    color: "#495057",
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});