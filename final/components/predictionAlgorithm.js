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

// Function to extract a key phrase from category
const extractKeyPhrase = (category) => {
  let parts = category.split("/");
  // Take the last two parts for more context if available, else take the last part
  return parts.length > 2 ? parts.slice(-2).join(" ") : parts[parts.length - 1];
};

// Define a set of templates
const templates = [
  "Have you explored [KEYPHRASE]? It might be just what you're looking for! 🌟",
  "Looks like [KEYPHRASE] has caught your interest. Why not dive deeper into it? 🚀",
  "As a fan of [KEYPHRASE], you'll love checking out the latest trends and ideas. 🌈",
];

// Function to generate a suggestion
const generateSuggestion = (category) => {
  let keyPhrase = extractKeyPhrase(category);

  // Randomly select a template
  let template = templates[Math.floor(Math.random() * templates.length)];

  // Replace placeholder with key phrase
  return template.replace("[KEYPHRASE]", keyPhrase);
};

// Main function to get predictive suggestions
export const getPredictiveSuggestions = async (userId) => {
  const tasks = await fetchUserTasks(userId);
  const categoryCounts = {};

  for (const task of tasks) {
    // Classify each task
    const classification = await classifyContent(
      task.name + " " + (task.description || "")
    );
    const categories = classification.categories.sort(
      (a, b) => b.confidence - a.confidence
    );
    const mostLikelyCategory =
      categories.length > 0 ? categories[0].name : null;

    // Count the frequency of each category
    if (mostLikelyCategory) {
      const category = mostLikelyCategory.toLowerCase();
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  }

  // Determine top two categories
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((entry) => entry[0]);

  // Generate suggestions using the new dynamic method
  const dynamicSuggestions = topCategories.map((category) =>
    generateSuggestion(category)
  );

  // Fallback if no categories are predominant
  if (dynamicSuggestions.length === 0) {
    dynamicSuggestions.push(
      "You currently have no tasks. Consider adding some."
    );
  }

  return dynamicSuggestions;
};
