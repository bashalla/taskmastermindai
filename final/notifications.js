import * as Notifications from "expo-notifications";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function checkAndScheduleNotifications(userId) {
  // Fetch tasks from Firebase
  const tasks = await fetchTasksForUser(userId);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Start of the next day

  tasks.forEach((task) => {
    const deadline = new Date(task.deadline);
    if (
      deadline >= tomorrow &&
      deadline < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
    ) {
      // Schedule a local notification for this task
      scheduleNotification(task);
    }
  });
}

async function fetchTasksForUser(userId) {
  const tasks = [];
  const q = query(collection(db, "tasks"), where("userId", "==", userId));

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    tasks.push({ id: doc.id, ...doc.data() });
  });

  return tasks;
}

async function scheduleNotification(task) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Upcoming Task Deadline",
      body: `Don't forget to complete '${task.name}' to earn points!`,
      data: { taskId: task.id },
    },
    trigger: { seconds: (new Date(task.deadline) - new Date()) / 1000 },
  });
}
