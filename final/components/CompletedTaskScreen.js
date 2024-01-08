import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const CompletedTaskScreen = ({ navigation, route }) => {
  const { task } = route.params;
  const createdAt = new Date(task.createdAt.seconds * 1000);
  const completedAt = new Date(task.completedDate);
  const durationDays = Math.ceil(
    (completedAt - createdAt) / (1000 * 3600 * 24)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Completed</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{task.name}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
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
    marginBottom: 10,
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
