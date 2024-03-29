import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// CompletedTaskScreen component
const CompletedTaskScreen = ({ navigation, route }) => {
  const { task } = route.params;
  const createdAt = new Date(task.createdAt.seconds * 1000);
  const completedAt = new Date(task.completedDate);
  const durationDays = Math.ceil(
    (completedAt - createdAt) / (1000 * 3600 * 24)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{task.name}</Text>
        <Text style={styles.description}>{task.description}</Text>
        <Text style={styles.detail}>
          Completed: {task.completedDate.split("T")[0]}
        </Text>
        <Text style={styles.detail}>Duration: {durationDays} day(s)</Text>
        {task.pointsAwarded ? (
          <Text style={styles.points}>You received 10 points!</Text>
        ) : (
          <Text style={styles.points}>
            No points have been given for this task.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 26,
  },
  description: {
    fontSize: 18,
    color: "#333",
    marginBottom: 18,
  },
  detail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  points: {
    fontSize: 16,
    color: "green",
    marginTop: 10,
  },
});

export default CompletedTaskScreen;
