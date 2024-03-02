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
import { GOOGLE_CLOUD_API_KEY, OPENAI_API_KEY } from "@env";

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

// Function to get suggestions from GPT API
const getSuggestionsFromGPT = async (categories) => {
  try {
    const prompt = `The user is using a task manager app and finds the following categories most relevant: ${categories.join(
      ", "
    )}. Suggest 3-4 tasks that are likely to be useful for the user:`;
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions", // GPT-3.5 API endpoint
      {
        model: "gpt-3.5-turbo", // GPT-3.5 model
        messages: [{ role: "system", content: prompt }], // Format the prompt as a message
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("GPT-3.5 API Response:", response.data);

    // Extracting and limiting the number of suggestions
    if (response.data.choices && response.data.choices.length > 0) {
      const suggestions = response.data.choices
        .map((choice) => choice.message.content)
        .filter((content) => content);
      return suggestions.slice(0, 4); // Limitting to the first 3-4 suggestions
    } else {
      console.error("No valid suggestions received");
      return [];
    }
  } catch (error) {
    console.error("Error fetching suggestions from GPT:", error);
    throw error;
  }
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

  // Determining here top two categories
  const sortedCategories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const topCategories =
    sortedCategories.length > 1
      ? sortedCategories.slice(0, 2).map((entry) => entry[0])
      : sortedCategories.map((entry) => entry[0]);

  let suggestions;
  if (topCategories.length > 0) {
    // Get suggestions from GPT API
    suggestions = await getSuggestionsFromGPT(topCategories);
  } else {
    // Fallback if no categories are predominant
    suggestions = ["You currently have no tasks"];
  }

  return suggestions;
};
