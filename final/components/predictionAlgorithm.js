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

// Function to analyze text using Google Cloud Natural Language API
const analyzeText = async (text) => {
  try {
    const response = await axios.post(
      `https://language.googleapis.com/v1/documents:analyzeEntities?key=${GOOGLE_CLOUD_API_KEY}`,
      { document: { content: text, type: "PLAIN_TEXT" } }
    );
    console.log("API Response:", response.data); // Console log the response
    return response.data;
  } catch (error) {
    console.error("Error analyzing text:", error);
    throw error;
  }
};

// Function to get tasks from Firebase for a specific user

const fetchUserTasks = async (userId) => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const tasks = [];
  querySnapshot.forEach((doc) => {
    tasks.push({ id: doc.id, ...doc.data() });
  });
  console.log("Fetched Tasks:", tasks);
  return tasks;
};

// Function to mark a task as analyzed and store analysis types
const markTaskAsAnalyzed = async (taskId, analysisTypes) => {
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, {
    analyzed: true,
    analysisTypes: analysisTypes,
  });
  console.log(`Task ${taskId} marked as analyzed with types:`, analysisTypes); // Console log the update
};

// Function to categorize tasks based on analysis
const categorizeTasks = (tasks) => {
  const categoryCounts = {};
  tasks.forEach((task) => {
    task.analysisTypes.forEach((type) => {
      const category = type.toLowerCase();
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  });
  return categoryCounts;
};

// Function to update category counts in user's profile
const updateCategoryCounts = async (userId, categoryCounts) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    categoryCounts: categoryCounts,
  });
};

// Main function to get predictive suggestions
export const getPredictiveSuggestions = async (userId) => {
  const tasks = await fetchUserTasks(userId);
  const analyzedTasks = await Promise.all(
    tasks.map(async (task) => {
      if (!task.analyzed) {
        const analysis = await analyzeText(
          task.name + " " + (task.description || "")
        );
        const analysisTypes = analysis.entities.map((entity) => entity.name); // Extract types from analysis
        await markTaskAsAnalyzed(task.id, analysisTypes);
        return { ...task, analysisTypes };
      }
      return task;
    })
  );

  const categoryCounts = categorizeTasks(analyzedTasks);

  const suggestions = [];
  for (const category in categoryCounts) {
    if (categoryCounts[category] >= 3) {
      suggestions.push(`Do you need to add tasks related to ${category}?`);
    }
  }

  return suggestions;
};
