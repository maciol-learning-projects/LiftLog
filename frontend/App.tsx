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
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // NEW
import LoginScreen from "./screens/LoginScreen"; // NEW
import RegisterScreen from "./screens/RegisterScreen"; // NEW

type RootStackParamList = {
  Home: undefined;
  Workouts: undefined;
  WorkoutDetails: { workoutId: number };
  ExerciseBrowser: { workoutId: number; existingExercises: number[] };
  ActiveWorkout: { workout: Workout };
  WorkoutHistory: undefined;
  Login: undefined; // NEW
  Register: undefined; // NEW
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// NEW: Separate component for the navigator to use auth hook
function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <Stack.Navigator>
      {user ? (
        // USER IS AUTHENTICATED - Show main app (no HomeScreen)
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: "LiftLog" }} 
          />
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
            options={{ title: "Workout History" }}
          />
        </>
      ) : (
        // USER IS NOT AUTHENTICATED - Show landing + auth
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: "LiftLog", headerShown: false }} 
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: "Login" }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: "Create Account" }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}