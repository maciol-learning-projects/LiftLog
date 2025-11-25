// App.tsx - Use this version again
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import WorkoutListScreen from "./screens/WorkoutListScreen";
import WorkoutDetailsScreen from "./screens/WorkoutDetailsScreen";
import ExerciseBrowserScreen from "./screens/ExerciseBrowserScreen";
import ActiveWorkoutScreen from "./screens/ActiveWorkoutScreen";
import { Workout } from "../shared/types";
import WorkoutHistoryScreen from "./screens/WorkoutHistoryScreen";

type RootStackParamList = {
  Home: undefined;
  Workouts: undefined;
  WorkoutDetails: { workoutId: number };
  ExerciseBrowser: { workoutId: number; existingExercises: number[] }
  ActiveWorkout: { workout: Workout };
  WorkoutHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "LiftLog" }} />
        <Stack.Screen
          name="Workouts"
          component={WorkoutListScreen}
          options={{ title: "Your Workouts", headerLeft: () => null, gestureEnabled: false }}
        />
        <Stack.Screen
          name="WorkoutDetails"
          component={WorkoutDetailsScreen}
          options={{ title: "Workout Details" }}
        />
        <Stack.Screen
          name="ExerciseBrowser"
          component={ExerciseBrowserScreen}
          options={{ title: "Browse Exercises" }}
        />
        <Stack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{ title: "Active Workout" }}
        />
        <Stack.Screen
          name="WorkoutHistory"
          component={WorkoutHistoryScreen}
          options={{ 
            title: "Workout History",
           }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}