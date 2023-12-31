import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Alert,
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

function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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
      const apiKey = OPEN_WEATHER;
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
      const response = await axios.get(url);
      const currentWeather = response.data.current.weather[0].main;
      return currentWeather;
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  };

  const markTaskComplete = async (task) => {
    try {
      const today = new Date();
      const deadlineDate = new Date(task.deadline);
      const isBeforeDeadline = today <= deadlineDate;
      const pointsAwarded = isBeforeDeadline ? 10 : 0;

      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, {
        isCompleted: true,
        pointsAwarded: pointsAwarded,
      });

      fetchTasksDueToday(); // Refresh tasks
    } catch (error) {
      console.error("Error marking task as complete: ", error);
    }
  };

  const fetchTasksDueToday = async () => {
    try {
      const today = new Date();
      const dateStringToday = today.toISOString().split("T")[0];

      const categoriesRef = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categoryColors = {};
      categoriesSnapshot.forEach((doc) => {
        const categoryData = doc.data();
        categoryColors[doc.id] = categoryData.color;
      });

      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      let fetchedTasks = [];
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        const taskDate = task.deadline.split("T")[0];
        if (!task.isCompleted && taskDate <= dateStringToday) {
          fetchedTasks.push({
            ...task,
            id: doc.id,
            categoryColor: categoryColors[task.categoryId] || "#000",
          });
        }
      });

      setTasks(fetchedTasks);
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

  const getWeatherIconName = (weatherCode) => {
    switch (weatherCode) {
      case "Clear":
        return "wb-sunny";
      case "Rain":
        return "umbrella";
      case "Clouds":
        return "cloud";
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader onSignOut={handleSignOut} />
      <Text style={styles.headerText}>Hello, {userName}</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <View
              style={[
                styles.categoryCircle,
                { backgroundColor: item.categoryColor },
              ]}
            />
            <Text style={styles.taskText}>{item.name}</Text>
            {item.weatherCode && (
              <Icon
                name={getWeatherIconName(item.weatherCode)}
                size={24}
                color="#4F8EF7"
              />
            )}
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => markTaskComplete(item)}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
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
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    marginTop: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    width: "90%",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignSelf: "center",
  },
  colorSelectionText: {
    alignSelf: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "black",
  },
  button: {
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    width: "90%",
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  flatList: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    flex: 1,
    padding: 20,
    marginVertical: 5,
    borderRadius: 5,
    alignSelf: "center",
  },
  categoryText: {
    color: "white",
    fontWeight: "bold",
  },
  iconContainer: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
});

export default CategoryScreen;
