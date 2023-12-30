// HomeScreen.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
} from "react-native";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";

function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Fetch user information
    const fetchUserInfo = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(`${userData.firstName}`); // Assuming you store first name in 'firstName' and last name in 'name'
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user info: ", error);
      }
    };

    fetchUserInfo();

    const fetchTasksDueToday = async () => {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const tasksRef = collection(db, "tasks");
        const q = query(
          tasksRef,
          where("userId", "==", auth.currentUser.uid),
          where("deadline", ">=", Timestamp.fromDate(startOfDay)),
          where("deadline", "<", Timestamp.fromDate(endOfDay))
        );

        const querySnapshot = await getDocs(q);
        const fetchedTasks = [];
        querySnapshot.forEach((doc) => {
          fetchedTasks.push({ ...doc.data(), id: doc.id });
        });
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching tasks: ", error);
      }
    };

    fetchTasksDueToday();
  }, []);

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={{ marginRight: 10, color: "#0782F9" }}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>Hello, {userName}</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskText}>{item.name}</Text>
            {/* Display other task details here */}
          </View>
        )}
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
  // Add any additional styling you need here
});

export default HomeScreen;
