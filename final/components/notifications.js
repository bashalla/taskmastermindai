import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Permissions from "expo-permissions";
import { collection, getDocs, query, where } from "firebase/firestore";
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
    token = (await Notifications.getExpoPushTokenAsync()).data;
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
  const deadline = new Date(task.deadline);
  const dayBefore = new Date(deadline);
  dayBefore.setDate(deadline.getDate() - 1);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Task Reminder",
      body: `Don't forget to complete '${task.name}' by tomorrow!`,
    },
    trigger: dayBefore,
  });
};

// Function to check tasks and schedule notifications
export const checkTasksAndScheduleNotifications = async () => {
  try {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      console.error("User ID is undefined. User might not be logged in.");
      return;
    }

    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      where("notificationScheduled", "==", false) // Select tasks without a scheduled notification
    );
    const snapshot = await getDocs(tasksQuery);

    snapshot.forEach(async (doc) => {
      const task = doc.data();
      const deadline = new Date(task.deadline);
      const now = new Date();

      // Check if task is due tomorrow
      if (
        !task.isCompleted &&
        deadline - now > 86400000 &&
        deadline - now < 172800000
      ) {
        await scheduleNotification(task);

        // Update task to indicate notification has been scheduled
        await updateDoc(doc.ref, {
          notificationScheduled: true,
        });
      }
    });
  } catch (error) {
    console.error("Error scheduling notifications:", error);
  }
};
