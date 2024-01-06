import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import axios from "axios";
import { OPEN_WEATHER } from "@env";
import CategoryScreen from "./CategoryScreen";

// This component will be used to display the user's tasks due today
function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});

  const fetchCategories = async () => {
    const categoriesRef = collection(db, "categories");
    const querySnapshot = await getDocs(categoriesRef);
    const fetchedCategories = {};
    querySnapshot.forEach((doc) => {
      fetchedCategories[doc.id] = doc.data().color;
    });
    setCategories(fetchedCategories);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Custom header component
  const CustomHeader = ({ onSignOut }) => {
    return (
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <Icon name="exit-to-app" size={40} color="#0782F9" />
          <Text style={styles.invisibleText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Fetch user info from Firestore
  const fetchUserInfo = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUserName(`${userData.firstName}`);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user info: ", error);
    }
  };

  // Fetch weather data from OpenWeather API
  const fetchWeather = async (latitude, longitude) => {
    try {
      const apiKey = OPEN_WEATHER; // Use your OpenWeather API key
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

      console.log("Fetching weather from: ", url);
      const response = await axios.get(url);
      const weatherDescription = response.data.current.weather[0].description; // Changed to description
      return weatherDescription;
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  };

  // Fetch tasks due today from Firestore
  const fetchTasksDueToday = async () => {
    try {
      const today = new Date();
      const dateStringToday = today.toISOString().split("T")[0];

      // Reference to the tasks collection in Firestore
      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      let fetchedTasks = [];
      querySnapshot.forEach((doc) => {
        // Only add tasks that are not completed and are due today or earlier
        const task = doc.data();
        const taskDate = task.deadline.split("T")[0];
        if (!task.isCompleted && taskDate <= dateStringToday) {
          const isOverdue = taskDate < dateStringToday;
          fetchedTasks.push({ ...task, id: doc.id, isOverdue });
        }
      });

      // Fetching weather data for each task only if location data is available
      const fetchedTasksWithWeather = await Promise.all(
        fetchedTasks.map(async (task) => {
          let weatherCode = null;
          if (
            task.location &&
            task.location.latitude &&
            task.location.longitude
          ) {
            weatherCode = await fetchWeather(
              task.location.latitude,
              task.location.longitude
            );
          }
          return { ...task, weatherCode };
        })
      );

      // Update the local state to reflect the fetched tasks
      setTasks(fetchedTasksWithWeather);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  // Fetch tasks due today when the screen is focused
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasksDueToday().then(() => setRefreshing(false));
  }, []);

  // Fetch tasks due today when the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchCategories(); // Fetch categories before fetching tasks

      fetchUserInfo();
      fetchTasksDueToday();
    });

    return unsubscribe;
  }, [navigation]);

  // Sign out the user and redirect to the Login screen
  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };

  // Get the icon name based on the weather description
  const getWeatherIconName = (description) => {
    switch (description.toLowerCase()) {
      case "clear sky":
        return "wb-sunny";
      case "scattered clouds":
      case "broken clouds":
      case "overcast clouds":
      case "few clouds":
        return "wb-cloudy";
      case "shower rain":
      case "light intensity shower rain":
      case "shower rain":
      case "heavy intensity shower rain":
      case "ragged shower rain":
      case "rain":
      case "light rain":
      case "moderate rain":
      case "heavy intensity rain":
      case "very heavy rain":
      case "extreme rain":
      case "freezing rain":
        return "umbrella"; // This icon is a close approximation
      case "thunderstorm":
      case "thunderstorm with light rain":
      case "thunderstorm with rain":
        return "thunderstorm";
      case "snow":
      case "light snow":
      case "heavy snow":
        return "ac-unit";
      case "mist":
      case "smoke":
      case "haze":
      case "sand/dust whirls":
      case "fog":
      case "sand":
      case "dust":
      case "volcanic ash":
      case "squalls":
      case "tornado":
        return "visibility";
      // ... include any other conditions
      default:
        return "wb-cloudy"; // Default icon for unknown conditions
    }
  };

  // Get the icon color based on the weather description
  const getWeatherIconColor = (description) => {
    if (description.toLowerCase() === "clear sky") {
      return "#FFD700"; // Yellow for clear sky here
    } else {
      return "#4F8EF7"; // Default blue for other conditions
    }
  };

  const markTaskComplete = async (taskId) => {
    try {
      // Reference to the specific task in Firestore
      const taskRef = doc(db, "tasks", taskId);

      // Get current task data
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        console.log("No such task!");
        return;
      }
      const task = taskSnap.data();
      const deadline = new Date(task.deadline);
      const now = new Date();

      // Check if the task is overdue
      const isOverdue = now > deadline;

      // Check if deadline change count is less than 3
      const isChangeLimitNotExceeded = (task.deadlineChangeCount || 0) < 3;

      if (isOverdue) {
        // Display an alert if the task is overdue
        Alert.alert("Task Overdue", "This task is overdue. No points awarded.");
      } else if (!isChangeLimitNotExceeded) {
        // Display an alert if the deadline has been changed 3 or more times
        Alert.alert(
          "Deadline Changed",
          "You will not get any points as you extended the deadline 3 or more times."
        );
      } else {
        // Task is on time and change limit did not exceeded
        // Get current user data
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.log("No such user!");
          return;
        }
        const userData = userSnap.data();

        // Update the users points
        const newPoints = (userData.points || 0) + 10;
        await updateDoc(userRef, {
          points: newPoints,
        });
      }

      // Update the task in Firestore as completed
      await updateDoc(taskRef, {
        isCompleted: true,
      });

      // Update the local state to reflect the task's completion
      setCompletedTasks((prev) => ({ ...prev, [taskId]: true }));

      fetchTasksDueToday();
    } catch (error) {
      console.error("Error marking task as complete: ", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader onSignOut={handleSignOut} />
      <Text style={styles.headerText}>Hello, {userName}</Text>
      <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
      <Text style={styles.subHeaderText}>Today's Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={item.isOverdue ? styles.overdueTaskItem : styles.taskItem}
          >
            {/* Category Color Circle */}
            <View
              style={[
                styles.categoryCircle,
                { backgroundColor: categories[item.categoryId] || "#000" }, // Default color if not found
              ]}
            />

            {/* Weather Icon and Task Name */}
            {item.weatherCode && (
              <Icon
                name={getWeatherIconName(item.weatherCode)}
                size={30}
                color={getWeatherIconColor(item.weatherCode)}
              />
            )}
            <Text style={styles.taskText}>{item.name}</Text>

            {/* Complete Task Button */}
            {!item.isCompleted && (
              <TouchableOpacity
                onPress={() => markTaskComplete(item.id)}
                style={styles.completeButton}
              >
                {completedTasks[item.id] ? (
                  <Icon name="check-circle" size={30} color="#4CAF50" /> // Green check for completed tasks
                ) : (
                  <Icon
                    name="radio-button-unchecked"
                    size={30}
                    color="#CCCCCC"
                  /> // Grey circle for incomplete tasks
                )}
              </TouchableOpacity>
            )}

            {/* Overdue Text */}
            {item.isOverdue && <Text style={styles.overdueText}>Overdue</Text>}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EAED",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    padding: 20,
    color: "#333",
  },
  invisibleText: {
    height: 0,
    width: 0,
    opacity: 0,
  },
  dateText: {
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#555",
  },
  subHeaderText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#444",
    paddingBottom: 10,
  },
  taskItem: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  overdueTaskItem: {
    backgroundColor: "#FFE0E0",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  taskText: {
    fontSize: 18,
    marginLeft: 10,
    flex: 1,
  },
  overdueText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
    paddingTop: 20,
  },
  signOutButton: {
    marginRight: 15,
  },
  categoryCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 10,
  },
  completeButton: {
    padding: 8,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default HomeScreen;
