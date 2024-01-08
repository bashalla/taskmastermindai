import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons"; // Ensure you have this package for icons

const CompletedTaskScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const createdAt = new Date(task.createdAt.seconds * 1000); // Assuming createdAt is a timestamp
  const completedAt = new Date(task.completedDate);
  const durationDays = Math.round(
    (completedAt - createdAt) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Completed</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{task.name}</Text>
        <Text style={styles.description}>{task.description}</Text>
        <Text style={styles.detail}>Completed in: {durationDays} day(s)</Text>
        {task.pointsAwarded && (
          <Text style={styles.points}>You received 10 points!</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    backgroundColor: "#6200EE", // or any color that suits your app
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  points: {
    fontSize: 16,
    color: "green",
    fontWeight: "bold",
  },
});

export default CompletedTaskScreen;
