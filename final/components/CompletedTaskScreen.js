import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const CompletedTaskScreen = ({ navigation, route }) => {
  const { task } = route.params;
  const createdAt = new Date(task.createdAt.seconds * 1000);
  const completedAt = new Date(task.completedDate);
  const durationDays = Math.ceil(
    (completedAt - createdAt) / (1000 * 3600 * 24)
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="arrow-back" size={30} color="#007AFF" />
      </TouchableOpacity>

      <Text style={styles.title}>{task.name}</Text>
      <View style={styles.content}>
        <Text style={styles.description}>{task.description}</Text>
        <Text style={styles.detail}>
          Completed: {task.completedDate.split("T")[0]}
        </Text>
        <Text style={styles.detail}>Duration: {durationDays} days</Text>
        {task.pointsAwarded ? (
          <Text style={styles.points}>You received 10 points!</Text>
        ) : (
          <Text style={styles.points}>
            No points have been given for this task.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 70,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    alignSelf: "center",
    marginBottom: 10,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  description: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  points: {
    fontSize: 16,
    color: "green",
    marginTop: 10,
  },
});

export default CompletedTaskScreen;
