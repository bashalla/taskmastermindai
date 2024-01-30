// RewardsScreen.js
import React from "react";
import { StyleSheet, Text, View } from "react-native";

function RewardsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Here is the rewards page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 20, // Adjust font size as needed
    fontWeight: "bold", // Adjust font weight as needed
  },
});

export default RewardsScreen;
