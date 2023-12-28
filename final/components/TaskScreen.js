import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  View,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const TaskPage = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const fetchedTasks = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        const taskName = taskData.name;

        fetchedTasks.push({ id: doc.id, name: taskName });
      });

      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tasks</Text>

      <FlatList
        style={styles.taskList}
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskName}>{item.name}</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // Navigate to the TaskCreation screen for creating a new task
          navigation.navigate("TaskCreation");
        }}
      >
        <Text style={styles.addButtonIcon}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          navigation.goBack();
        }}
      >
        <Text style={styles.backButtonText}>Back to Categories</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 10,
  },
  title: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: "#e0e0e0",
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  addButton: {
    backgroundColor: "#0782F9",
    width: 60, // Set the width and height to the same value
    height: 60, // Set the width and height to the same value
    borderRadius: 30, // Half of the width/height makes it round
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 100,
    right: 40,
    marginBottom: 20,
  },

  addButtonIcon: {
    color: "white",
    fontSize: 24,
  },
  backButton: {
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "90%",
    alignSelf: "center",
    marginBottom: 20,
  },
  backButtonText: {
    color: "white",
    fontWeight: "700",
  },
});

export default TaskPage;
