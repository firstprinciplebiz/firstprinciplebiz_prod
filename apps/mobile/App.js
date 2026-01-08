// This file is required by expo's default AppEntry.js
// It re-exports expo-router's root component
import { ExpoRoot } from "expo-router";
import { Platform } from "react-native";

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

export default App;

