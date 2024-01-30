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
  Platform,
  Dimensions,
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

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768; // Common breakpoint for tablet devices

const TaskScreen = ({ navigation, route }) => {
  const { categoryId, categoryName } = route.params;
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [hasOpenTasks, setHasOpenTasks] = useState(false);
  const [hasDoneTasks, setHasDoneTasks] = useState(false);

  const fetchTasks = async () => {
    setRefreshing(true);
    try {
      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("categoryId", "==", categoryId));
      const querySnapshot = await getDocs(q);

      const overdueTasks = [];
      const onTimeTasks = [];
      const completedTasks = [];
      querySnapshot.forEach((doc) => {
        const task = { ...doc.data(), id: doc.id };
        const deadlineDate = new Date(task.deadline);
        const currentDate = new Date();

        task.isOverdue = currentDate > deadlineDate && !task.isCompleted;
        task.isOnTime = currentDate <= deadlineDate && !task.isCompleted;

        if (task.isOverdue) {
          overdueTasks.push(task);
        } else if (task.isCompleted) {
          completedTasks.push(task);
        } else if (task.isOnTime) {
          onTimeTasks.push(task);
        }
      });

      // Update state to indicate if there are open or done tasks
      setHasOpenTasks(overdueTasks.length > 0 || onTimeTasks.length > 0);
      setHasDoneTasks(completedTasks.length > 0);

      // Concatenate the arrays: first overdue, then on-time, then completed
      const sortedTasks = [...overdueTasks, ...onTimeTasks];

      if (completedTasks.length > 0) {
        sortedTasks.push({ isHeadline: true, title: "Done Tasks" });
        sortedTasks.push(...completedTasks);
      }

      setTasks(sortedTasks);
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

      // Check if the platform is iOS before requesting reminders permissions
      if (Platform.OS === "ios") {
        const { status: remindersStatus } =
          await Calendar.requestRemindersPermissionsAsync();
        if (calendarStatus !== "granted" || remindersStatus !== "granted") {
          Alert.alert(
            "Permissions required",
            "Calendar and reminders access is needed to add events"
          );
        }
      } else if (calendarStatus !== "granted") {
        Alert.alert(
          "Permissions required",
          "Calendar access is needed to add events"
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
  const markTaskAsDone = async (task) => {
    try {
      const now = new Date();
      const isOverdue = now > new Date(task.deadline);
      const isChangeLimitNotExceeded = (task.deadlineChangeCount || 0) < 3;

      // Determine if points should be awarded
      let pointsAwardedFlag = false;
      if (!isOverdue && isChangeLimitNotExceeded) {
        pointsAwardedFlag = true;
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newPoints = (userData.points || 0) + 10; // 10 points for a completed task
          await updateDoc(userRef, {
            points: newPoints,
          });
        }
      }

      // Update the task as completed in Firestore along with completion time and points awarded flag
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, {
        isCompleted: true,
        completedDate: now.toISOString(), // Storing the completion date
        pointsAwarded: pointsAwardedFlag, // Storing if points were awarded
      });

      // Preparing alert message based on task completion status and points awarded
      let alertMessage = "Task marked as completed.";
      alertMessage += pointsAwardedFlag
        ? " You've been awarded 10 points!"
        : " No points awarded.";
      if (isOverdue) {
        alertMessage = "Task is overdue. No points awarded.";
      } else if (!isChangeLimitNotExceeded) {
        alertMessage =
          "Deadline has been changed 3 or more times. No points awarded.";
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
      // Navigate to the CompletedTaskScreen for viewing completed tasks
      navigation.navigate("CompletedTaskScreen", { task: item });
    } else {
      // Set the state to indicate a refresh may be needed
      setNeedsRefresh(true);
      // Navigate to the TaskDetailScreen for editing incomplete tasks
      navigation.navigate("TaskDetailScreen", { task: item });
    }
  };

  // Add a task to the calendar
  const addTaskToCalendar = async (task) => {
    try {
      // Check if the task already has a calendar event ID
      if (task.calendarEventId) {
        Alert.alert(
          "Duplicate Event",
          "This task already has a calendar entry in iCal."
        );
        return; // Exit the function early
      }

      // If no calendar event is associated with this task, proceed to add a new calendar event
      const calendarId = await findOrCreateCalendar(); // Make sure you have defined this function

      // Convert the deadline to a Date object
      let deadlineDate = new Date(task.deadline);
      deadlineDate.setMinutes(
        deadlineDate.getMinutes() + deadlineDate.getTimezoneOffset()
      );

      // Create calendar event
      const eventId = await Calendar.createEventAsync(calendarId, {
        title: task.name,
        startDate: deadlineDate,
        endDate: deadlineDate, // should be the same as startDate for a single-day event
        allDay: true,
        timeZone: Calendar.DEFAULT_TIMEZONE,
      });

      // Update the task with the new calendar event ID
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, { calendarEventId: eventId });

      // Alert user of success
      Alert.alert("Success", "Task added to calendar");

      // Optionally refresh tasks to reflect changes
      fetchTasks(); // Ensure you have a fetchTasks function to refresh the task list
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
      <Text style={styles.title}>Open Tasks for {categoryName}</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item, index) => item.id || `item-${index}`}
        renderItem={({ item }) => {
          if (item.isHeadline) {
            return <Text style={styles.headline}>{item.title}</Text>;
          }

          let textStyle;
          if (item.isCompleted) {
            textStyle = styles.done;
          } else if (item.isOverdue) {
            textStyle = styles.overdue;
          } else {
            textStyle = styles.onTimeText; // On Time task style
          }

          let backgroundColor = item.isCompleted
            ? "#A9A9A9" // Background for completed tasks
            : item.isOverdue
            ? "#EC8F5E" // Background for overdue tasks
            : "#9BBEC8"; // Background for on-time tasks

          return (
            <View style={styles.taskItemContainer}>
              <View style={[styles.taskItem, { backgroundColor }]}>
                <TouchableOpacity
                  style={styles.taskDetails}
                  onPress={() => navigateToTaskDetail(item)}
                >
                  <Text style={styles.taskName}>{item.name}</Text>
                  <Text style={textStyle}>
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
                        <Icon name="check-circle" size={30} color="#A2FF86" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteTask(item)}
                      >
                        <Icon name="delete" size={30} color="#820300" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => addTaskToCalendar(item)}
                      >
                        <Icon name="calendar-today" size={30} color="#232D3F" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !hasOpenTasks && <Text style={styles.noTasksText}>No tasks</Text>
        }
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAE5",
    padding: 10,
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "bold",
    marginTop: isTablet ? 30 : 20,
    marginBottom: isTablet ? 30 : 20,
    marginLeft: 10,
  },
  taskList: {
    flex: 1,
  },
  taskItemContainer: {
    paddingVertical: isTablet ? 15 : 10,
    borderBottomWidth: 0,
    borderBottomColor: "#6B240C",
  },
  taskItem: {
    backgroundColor: "#C9D7DD",
    padding: isTablet ? 20 : 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskDetails: {
    flex: 1,
  },
  headline: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 80,
    marginLeft: 10,
  },
  taskName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#333333",
  },
  onTimeText: {
    color: "green", // Color for On Time text
    marginLeft: 5,
    marginTop: 2,
    fontSize: isTablet ? 16 : 14,
  },
  overdue: {
    color: "red",
    marginLeft: 5,
    fontSize: isTablet ? 16 : 14,
  },
  done: {
    color: "#0C356A",
    marginLeft: 5,
    fontSize: isTablet ? 16 : 14,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: isTablet ? 15 : 10,
    padding: isTablet ? 10 : 8,
  },
  completeTaskText: {
    color: "#739072",
    marginRight: isTablet ? 15 : 10,
    fontSize: isTablet ? 16 : 15,
  },
  addButton: {
    backgroundColor: "#0782F9",
    width: isTablet ? 80 : 70,
    height: isTablet ? 80 : 70,
    borderRadius: isTablet ? 40 : 35,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 50,
    right: 25,
  },
  addButtonIcon: {
    color: "white",
    fontSize: isTablet ? 30 : 24,
  },
  taskItemOverdue: {
    backgroundColor: "red",
  },
  taskItemOnTime: {
    backgroundColor: "blue",
  },
  taskItemDone: {
    backgroundColor: "green",
  },
  noTasksText: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
    color: "#666",
  },
});

export default TaskScreen;
