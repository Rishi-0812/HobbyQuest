// App.js — Root entry point for HobbyQuest
// This is the only file Expo looks at to start the app.
// Everything else flows from AppNavigator.

import 'react-native-gesture-handler'; // Must be first import
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}