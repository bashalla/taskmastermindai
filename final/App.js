import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text } from "react-native"; // Removed the StatusBar import from react-native
import { StyleSheet, View } from "react-native";
import Signup from "./components/SignUp";
import Login from "./components/Login";
import { auth } from "./configuration/firebase";

export default function App() {
  return (
    <View style={styles.container}>
      <Signup /> {/* Render the Signup component */}
      <Login /> {/* Render the Login component */}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
