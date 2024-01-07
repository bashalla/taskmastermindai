import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  View,
  Alert,
  RefreshControl,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../firebase";
import * as Calendar from "expo-calendar";

const TaskScreen = ({ navigation, route }) => {
  const { categoryId, categoryName } = route.params;
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const fetchTasks = async () => {
    setRefreshing(true);
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
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      const { status: calendarStatus } =
        await Calendar.requestCalendarPermissionsAsync();
      const { status: remindersStatus } =
        await Calendar.requestRemindersPermissionsAsync();
      if (calendarStatus !== "granted" || remindersStatus !== "granted") {
        Alert.alert(
          "Permissions required",
          "Calendar and reminders access is needed to add events"
        );
      }
    })();
    fetchTasks();
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  // Mark a task as completed
  // Mark a task as completed
  const markTaskAsDone = async (task) => {
    try {
      const now = new Date();
      const isOverdue = now > new Date(task.deadline);
      const isChangeLimitNotExceeded = (task.deadlineChangeCount || 0) < 3;

      // Update the task as completed in Firestore
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, {
        isCompleted: true,
      });

      let alertMessage = "Task marked as completed.";

      // Initialize the points to be awarded
      let pointsAwarded = 0;

      // Check conditions and update points or show alert
      if (!isOverdue && isChangeLimitNotExceeded) {
        // Award points to the user
        pointsAwarded = 10; // Define how many points should be awarded for a completed task
        // Fetch and update user's points here...
        const userRef = doc(db, "users", auth.currentUser.uid); // Assuming you have a users collection
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newPoints = (userData.points || 0) + pointsAwarded;
          await updateDoc(userRef, {
            points: newPoints,
          });
          alertMessage += ` You've been awarded ${pointsAwarded} points!`;
        }
      } else {
        if (isOverdue) {
          alertMessage = "Task is overdue. ";
        }
        if (!isChangeLimitNotExceeded) {
          alertMessage += "Deadline has been changed 3 or more times. ";
        }
        alertMessage += "No points awarded.";
      }

      Alert.alert("Task Update", alertMessage);

      fetchTasks(); // Fetch or refresh the tasks list if needed
    } catch (error) {
      console.error("Error marking task as done: ", error);
      Alert.alert("Error", "Unable to mark task as done.");
    }
  };

  // Delete a task
  const deleteTask = async (task) => {
    if (task.isCompleted) {
      Alert.alert("Task Completed", "Completed tasks cannot be deleted.");
      return;
    }

    const taskRef = doc(db, "tasks", task.id);
    await deleteDoc(taskRef);

    fetchTasks();
  };

  // Navigate to the task detail screen
  const navigateToTaskDetail = (item) => {
    if (item.isCompleted) {
      Alert.alert(
        "Task Completed",
        "This task is already completed and cannot be edited."
      );
      return;
    }
    setNeedsRefresh(true); // Indicate that a refresh will be needed
    navigation.navigate("TaskDetailScreen", { task: item });
  };

  // Add a task to the calendar
  const addTaskToCalendar = async (task) => {
    try {
      const calendarId = await findOrCreateCalendar();

      // Convert the deadline to a Date object
      let deadlineDate = new Date(task.deadline);
      deadlineDate.setMinutes(
        deadlineDate.getMinutes() + deadlineDate.getTimezoneOffset()
      );

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: task.name,
        startDate: deadlineDate,
        endDate: deadlineDate, // needs to be same as startDate for a single day event
        allDay: true,
        timeZone: Calendar.DEFAULT_TIMEZONE,
      });

      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, { calendarEventId: eventId });

      Alert.alert("Success", "Task added to calendar");
      fetchTasks(); // Refresh the task list after adding to calendar
    } catch (error) {
      console.error("Error adding to calendar: ", error);
      Alert.alert("Error", "Unable to add task to calendar.");
    }
  };

  // Find or create the calendar
  const findOrCreateCalendar = async () => {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    // console.log("Calendars:", calendars);
    const expoCalendar = calendars.find((c) => c.title === "Expo Calendar");

    if (expoCalendar) {
      return expoCalendar.id;
    } else {
      // Create a new calendar
      const defaultCalendarSource =
        Platform.OS === "ios"
          ? await getDefaultCalendarSource()
          : { isLocalAccount: true, name: "Expo Calendar" };

      // console.log("Creating new calendar with source:", defaultCalendarSource);
      return await Calendar.createCalendarAsync({
        title: "Expo Calendar",
        color: "blue",
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendarSource.id,
        source: defaultCalendarSource,
        name: "internalCalendarName",
        ownerAccount: "personal",
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
    }
  };

  // Get the default calendar source
  const getDefaultCalendarSource = async () => {
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      console.log("Available Calendars:", calendars);

      let defaultSource = null;
      if (Platform.OS === "ios") {
        // Find inga default source
        defaultSource = calendars.find(
          (calendar) => calendar.source && calendar.source.isLocalAccount
        );

        // If no default source is found, create one or choose a fallback
        if (!defaultSource) {
          console.log(
            "No suitable default calendar source found on iOS. Creating or choosing a fallback."
          );
          // Check if there's a source available, create one if not
          defaultSource = { isLocalAccount: true, name: "Expo Calendar" };
        }
      } else {
        defaultSource = { isLocalAccount: true, name: "Expo Calendar" };
      }

      console.log("Selected Default Source:", defaultSource);
      return defaultSource ? defaultSource : null;
    } catch (error) {
      console.error("Error getting default calendar source:", error);
      return null; // Fallback if there's an error
    }
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
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => markTaskAsDone(item)}
                    >
                      <Text style={styles.completeTaskText}>Complete Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteTask(item)}
                    >
                      <Icon name="delete" size={20} color="red" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => addTaskToCalendar(item)}
                    >
                      <Icon name="calendar-today" size={20} color="blue" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTasks} />
        }
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
  actionButton: {
    marginLeft: 10,
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
