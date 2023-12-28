import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  View,
  Alert,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { db } from "../firebase";

const TaskScreen = ({ navigation, route }) => {
  const { categoryId, categoryName } = route.params;
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("categoryId", "==", categoryId));
      const querySnapshot = await getDocs(q);
      const fetchedTasks = [];

      querySnapshot.forEach((doc) => {
        fetchedTasks.push({ ...doc.data(), id: doc.id });
      });

      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      Alert.alert("Error", "Unable to fetch tasks.");
    }
  };

  // useEffect for initial fetch
  useEffect(() => {
    fetchTasks();
  }, [categoryId]);

  // useFocusEffect to refetch tasks when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [categoryId])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tasks for {categoryName}</Text>

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
          // In the component where you navigate to CreateTask
          navigation.navigate("CreateTask", {
            categoryId,
            onGoBack: () => fetchTasks(),
          });
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
  },
  backButtonText: {
    color: "white",
    fontWeight: "700",
  },
});

export default TaskScreen;
