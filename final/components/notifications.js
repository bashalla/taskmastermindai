import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase"; // Ensure this path is correct

// Handler for incoming notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Function to request permission for push notifications
export const registerForPushNotificationsAsync = async () => {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    // Get the Expo push token
    token = (
      await Notifications.getExpoPushTokenAsync({
        experienceId: "@bashalla/unifinaltaskmanager",
        projectId: "1e34c809-583a-48f3-86a6-671d63be523d", // Use the Expo project ID you obtained
      })
    ).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
};

// Function to schedule a notification
const scheduleNotification = async (task) => {
  // Create a new date object for the next day at 10:00 AM
  let notificationTime = new Date();
  notificationTime.setHours(10, 0, 0); // Set time to 10:00 AM

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Reminder",
      body: `Don't forget to complete '${task.name}' by today to get points!`,
    },
    trigger: notificationTime,
  });
};

// Function to check tasks due today and schedule notifications
// Function to check tasks due today and schedule notifications
export const checkTasksAndScheduleNotifications = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("User ID is undefined. User might not be logged in.");
      return;
    }

    // Query for tasks where notificationScheduled is not true
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      where("notificationScheduled", "!=", true)
    );
    const snapshot = await getDocs(tasksQuery);

    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    snapshot.forEach(async (doc) => {
      const task = doc.data();
      const taskDeadlineDate = new Date(task.deadline);
      const taskDeadlineString = taskDeadlineDate.toISOString().split("T")[0];

      if (!task.isCompleted && taskDeadlineString === todayString) {
        await scheduleNotification(task);
        await updateDoc(doc.ref, {
          notificationScheduled: true,
        });
      }
    });
  } catch (error) {
    console.error("Error checking tasks and scheduling notifications:", error);
  }
};
