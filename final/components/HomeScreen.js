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
      const apiKey = OPEN_WEATHER; // Use your OpenWeather API key
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

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
        if (taskDate === dateStringToday && !task.isCompleted) {
          fetchedTasks.push({ ...task, id: doc.id });
        }
      });

      const fetchedTasksWithWeather = await Promise.all(
        fetchedTasks.map(async (task) => {
          const weatherCode = await fetchWeather(
            task.location.latitude,
            task.location.longitude
          );
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

  const getWeatherIconName = (weatherCode) => {
    switch (weatherCode) {
      case "Clear":
        return "wb-sunny";
      case "Rain":
        return "umbrella";
      case "Clouds":
        return "cloud";
      default:
        return "error";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader onSignOut={handleSignOut} />
      <Text style={styles.headerText}>Hello, {userName}</Text>
      <Text style={styles.headerText}>Today's Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Icon
              name={getWeatherIconName(item.weatherCode)}
              size={24}
              color="#000"
            />
            <Text style={styles.taskText}>{item.name}</Text>
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
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    padding: 20,
  },
  taskItem: {
    backgroundColor: "#f9c2ff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  taskText: {
    fontSize: 18,
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 10,
    paddingTop: 20,
    backgroundColor: "#fff",
  },
  signOutButton: {
    marginRight: 15,
  },
});

export default HomeScreen;
