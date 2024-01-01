import React, { useEffect, useState, useCallback } from "react";
import {
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

  const CustomHeader = ({ onSignOut }) => {
    return (
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <Icon name="exit-to-app" size={40} color="#0782F9" />
        </TouchableOpacity>
      </View>
    );
  };

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

  const fetchWeather = async (latitude, longitude) => {
    try {
      const apiKey = OPEN_WEATHER; // Use your OpenWeather API key
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

      console.log("Fetching weather from: ", url);
      const response = await axios.get(url);
      const currentWeather = response.data.current.weather[0].main;
      return currentWeather;
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  };
  const fetchTasksDueToday = async () => {
    try {
      const today = new Date();
      const dateStringToday = today.toISOString().split("T")[0];

      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      let fetchedTasks = [];
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        const taskDate = task.deadline.split("T")[0];
        if (!task.isCompleted && taskDate <= dateStringToday) {
          const isOverdue = taskDate < dateStringToday;
          fetchedTasks.push({ ...task, id: doc.id, isOverdue });
        }
      });

      // Fetch weather data for each task only if location data is available
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

      setTasks(fetchedTasksWithWeather);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasksDueToday().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUserInfo();
      fetchTasksDueToday();
    });

    return unsubscribe;
  }, [navigation]);

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };

  const getWeatherIconName = (description) => {
    switch (description.toLowerCase()) {
      case "clear sky":
        return "wb-sunny";
      case "few clouds":
      case "scattered clouds":
        return "cloud";
      case "broken clouds":
      case "overcast clouds":
        return "cloud-queue";
      case "shower rain":
      case "rain":
        return "grain";
      case "thunderstorm":
        return "flash-on";
      case "snow":
        return "ac-unit";
      case "mist":
      case "haze":
      case "fog":
        return "cloud-circle";
      case "drizzle":
        return "invert-colors";
      // Add more cases as needed
      default:
        return "wb-cloudy"; // Default icon for unknown conditions
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

      // Check if the task is completed before the deadline and deadline change count is less than 3
      const isOnTime = now <= deadline;
      const isChangeLimitNotExceeded = (task.deadlineChangeCount || 0) < 3;

      if (isOnTime && isChangeLimitNotExceeded) {
        // Get current user data
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.log("No such user!");
          return;
        }
        const userData = userSnap.data();

        // Update the user's points
        const newPoints = (userData.points || 0) + 10;
        await updateDoc(userRef, {
          points: newPoints,
        });
      } else if (!isOnTime || !isChangeLimitNotExceeded) {
        // Optionally, handle the case where the task is overdue or deadline change limit is exceeded
        if (!isChangeLimitNotExceeded) {
          // Display an alert if the deadline has been changed 3 or more times
          alert(
            "You will not get any points as you extended the deadline 3 or more times"
          );
        }
      }

      // Update the task in Firestore as completed
      await updateDoc(taskRef, {
        isCompleted: true,
      });

      // Update the local state to reflect the task's completion
      setCompletedTasks((prev) => ({ ...prev, [taskId]: true }));

      // Optionally, refresh the list of tasks
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
                color={item.weatherCode === "Clear" ? "#FFD700" : "#4F8EF7"}
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
    backgroundColor: "#E8EAED", // Background color for the entire screen
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    padding: 20,
    color: "#333", // Font color for the header text
  },
  dateText: {
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#555", // Style for the date display
  },
  subHeaderText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#444",
    paddingBottom: 10, // Style for the sub-header text
  },
  taskItem: {
    backgroundColor: "#FFFFFF", // Light background for task items
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center", // Styling for regular task items
  },
  overdueTaskItem: {
    backgroundColor: "#FFE0E0", // Light red for overdue tasks
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center", // Styling for overdue task items
  },
  taskText: {
    fontSize: 18,
    marginLeft: 10,
    flex: 1, // Styling for the task text
  },
  overdueText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D32F2F", // Style for the overdue indicator text
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
    paddingTop: 20, // Style for the custom header
  },
  signOutButton: {
    marginRight: 15, // Style for the sign-out button
  },
  categoryCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 10, // Style for the category color circle
  },
  completeButton: {
    // Styles for the complete task button
    padding: 8,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButtonText: {
    color: "white",
    fontWeight: "bold", // Text style for the 'Complete' button
  },
  // Add any additional styles you might have
});

export default HomeScreen;
