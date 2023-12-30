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
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
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
        const task = { ...doc.data(), id: doc.id };
        task.isOverdue = new Date() > new Date(task.deadline);
        fetchedTasks.push(task);
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      Alert.alert("Error", "Unable to fetch tasks.");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [categoryId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [categoryId])
  );

  const markTaskAsDone = async (task) => {
    const now = new Date();
    let points = 0;
    if (now <= new Date(task.deadline)) {
      points = 10; // Example points
    }

    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, {
      isCompleted: true,
      points: points,
    });

    fetchTasks();
  };

  const deleteTask = async (task) => {
    if (task.isCompleted) {
      Alert.alert("Task Completed", "Completed tasks cannot be deleted.");
      return;
    }

    const taskRef = doc(db, "tasks", task.id);
    await deleteDoc(taskRef);

    fetchTasks();
  };

  const navigateToTaskDetail = (item) => {
    if (item.isCompleted) {
      Alert.alert(
        "Task Completed",
        "This task is already completed and cannot be edited."
      );
      return;
    }
    navigation.navigate("TaskDetailScreen", { task: item });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tasks for {categoryName}</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItemContainer}>
            <View style={styles.taskItem}>
              <TouchableOpacity
                style={styles.taskDetails}
                onPress={() => navigateToTaskDetail(item)}
                disabled={item.isCompleted}
              >
                <Text style={styles.taskName}>{item.name}</Text>
                <Text
                  style={
                    item.isCompleted
                      ? styles.done
                      : item.isOverdue
                      ? styles.overdue
                      : null
                  }
                >
                  {item.isCompleted
                    ? "Done"
                    : item.isOverdue
                    ? "Overdue"
                    : "On Time"}
                </Text>
              </TouchableOpacity>
              <View style={styles.taskActions}>
                {item.isCompleted ? (
                  <Icon name="done" size={20} color="green" />
                ) : (
                  <TouchableOpacity onPress={() => markTaskAsDone(item)}>
                    <Text style={styles.completeTaskText}>Complete Task</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => deleteTask(item)}
                  disabled={item.isCompleted}
                >
                  <Icon
                    name="delete"
                    size={20}
                    color={item.isCompleted ? "gray" : "red"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("CreateTask", { categoryId })}
      >
        <Text style={styles.addButtonIcon}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
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
    marginTop: 20,
    marginBottom: 20,
  },
  taskList: {
    flex: 1,
  },
  taskItemContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  taskItem: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  overdue: {
    color: "red",
    marginLeft: 5,
  },
  done: {
    color: "green",
    marginLeft: 5,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  completeTaskText: {
    color: "#0782F9",
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#0782F9",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  addButtonIcon: {
    color: "white",
    fontSize: 24,
  },
  backButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 90,
    left: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default TaskScreen;
