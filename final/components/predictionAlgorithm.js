import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import axios from "axios";
import { GOOGLE_CLOUD_API_KEY } from "@env";

// Function to classify content using Google Cloud Natural Language API
const classifyContent = async (text) => {
  try {
    const response = await axios.post(
      `https://language.googleapis.com/v2/documents:classifyText?key=${GOOGLE_CLOUD_API_KEY}`,
      { document: { content: text, type: "PLAIN_TEXT" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error classifying content:", error);
    throw error;
  }
};

// Function to get tasks from Firebase
const fetchUserTasks = async (userId) => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const tasks = [];
  querySnapshot.forEach((doc) => {
    tasks.push({ id: doc.id, ...doc.data() });
  });
  return tasks;
};

// Function to mark a task as analyzed
const markTaskAsAnalyzed = async (taskId, category) => {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, { analyzed: true, category: category });
};

// Main function to get predictive suggestions
export const getPredictiveSuggestions = async (userId) => {
  const tasks = await fetchUserTasks(userId);
  const categoryCounts = {};

  for (const task of tasks) {
    if (!task.analyzed) {
      const classification = await classifyContent(
        task.name + " " + (task.description || "")
      );
      const categories = classification.categories.sort(
        (a, b) => b.confidence - a.confidence
      );
      const mostLikelyCategory =
        categories.length > 0 ? categories[0].name : null;
      await markTaskAsAnalyzed(task.id, mostLikelyCategory);
      task.category = mostLikelyCategory; // Update task with analyzed category
    }

    if (task.category) {
      const category = task.category.toLowerCase();
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  }

  // Sort categories and pick top two
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((entry) => entry[0]);

  const suggestions = topCategories.map(
    (category) => `Consider adding tasks related to ${category}`
  );

  // Include a sentence for zero tasks
  if (tasks.length === 0) {
    suggestions.push("You currently have no tasks. Consider adding some.");
  }

  return suggestions;
};
