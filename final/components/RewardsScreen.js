import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

const userTypes = [
  { name: "Starter", minPoints: 0, maxPoints: 99 },
  { name: "Rookie", minPoints: 100, maxPoints: 499 },
  { name: "Intermediate", minPoints: 500, maxPoints: 999 },
  { name: "Advanced", minPoints: 1000, maxPoints: 2499 },
  { name: "Expert", minPoints: 2500, maxPoints: 4999 },
  { name: "Master", minPoints: 5000, maxPoints: 7499 },
  { name: "Legend Task Solver", minPoints: 7500, maxPoints: 100000000 },
];

// Placeholder for badge data
const badges = [
  { name: "Bronze", points: 0, image: require("../assets/badges/bronze.png") },
  {
    name: "Silver",
    points: 500,
    image: require("../assets/badges/silver.png"),
  },
  { name: "Gold", points: 1000, image: require("../assets/badges/gold.png") },
  {
    name: "Platinum",
    points: 2500,
    image: require("../assets/badges/platinum.png"),
  },
  {
    name: "Diamond",
    points: 5000,
    image: require("../assets/badges/diamond.png"),
  },
  {
    name: "Emerald",
    points: 5000,
    image: require("../assets/badges/emerald.png"),
  },
  { name: "Ruby", points: 7500, image: require("../assets/badges/ruby.png") },
];

// Rewards screen component
function RewardsScreen() {
  const [userPoints, setUserPoints] = useState(0);
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [successfulStreaks, setSuccessfulStreaks] = useState([]);

  const maxStreak = 5;

  const fetchUserData = async () => {
    setIsRefreshing(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPoints(userData.points || 0);
        await checkFiveDayStreak(userData.streakCount);
        await fetchCompletedTasks();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchCompletedTasks = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 4); // Get date from 5 days ago
    startDate.setHours(0, 0, 0, 0); // Set to start of the day

    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
      where("userId", "==", auth.currentUser.uid),
      where("completedDate", ">=", startDate.toISOString()),
      where("isCompleted", "==", true),
      where("pointsAwarded", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const uniqueDates = new Set();
    querySnapshot.forEach((doc) => {
      let taskDate = new Date(doc.data().completedDate).toLocaleDateString();
      uniqueDates.add(taskDate);
    });

    setCompletedTasks(Array.from(uniqueDates));
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const getUserType = (points) => {
    const type = userTypes.find(
      (type) => points >= type.minPoints && points <= type.maxPoints
    );
    return type ? type.name : "Unknown";
  };

  const fetchSuccessfulStreaks = async () => {
    try {
      const streaksRef = collection(db, "streaks");
      const q = query(
        streaksRef,
        where("userId", "==", auth.currentUser.uid),
        where("streakEnded", "==", true),
        where("pointsGiven", "==", true)
      );

      const querySnapshot = await getDocs(q);
      const streaks = [];
      querySnapshot.forEach((doc) => {
        streaks.push(doc.data());
      });

      setSuccessfulStreaks(streaks);
    } catch (error) {
      console.error("Error fetching streak data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchSuccessfulStreaks(); // Fetch successful streaks on component mount
  }, []);

  const getEarnedBadge = (points) => {
    return badges
      .slice()
      .reverse()
      .find((badge) => points >= badge.points);
  };

  const checkFiveDayStreak = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 4);
    startDate.setHours(0, 0, 0, 0);

    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
      where("userId", "==", auth.currentUser.uid),
      where("completedDate", ">=", startDate.toISOString()),
      where("isCompleted", "==", true)
    );
    const querySnapshot = await getDocs(q);

    let completedDates = new Set();
    querySnapshot.forEach((doc) => {
      let taskDate = new Date(doc.data().completedDate);
      completedDates.add(taskDate.toISOString().split("T")[0]);
    });

    let streakCount = 0; // Define streakCount here
    for (let i = 0; i < maxStreak; i++) {
      const checkDate = new Date();
      checkDate.setDate(startDate.getDate() + i);
      if (completedDates.has(checkDate.toISOString().split("T")[0])) {
        streakCount++;
      }
    }

    setCurrentStreak(streakCount);

    const userRef = doc(db, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (streakCount >= maxStreak && !userData.streakAwarded) {
        // Award 100 points and record the streak
        const newPoints = userData.points + 100;
        await updateDoc(userRef, {
          points: newPoints,
          streakAwarded: true,
          pointsAwarded: true, // Set pointsAwarded to true
        });

        // Record the streak in a new collection
        await addDoc(collection(db, "streaks"), {
          userId: auth.currentUser.uid,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          streakEnded: true, // Set streakEnded to true
          pointsGiven: true, // Set pointsGiven to true
        });

        // Reset the streak count to zero
        setCurrentStreak(0);

        // Update the user's points
        setUserPoints(newPoints);
      } else if (streakCount < maxStreak && userData.streakAwarded) {
        // Reset streakAwarded status after streak ends
        await updateDoc(userRef, {
          streakAwarded: false,
          pointsAwarded: false, // Reset pointsAwarded to false
        });
      } else if (streakCount > maxStreak) {
        // Handle the case where streak was unsuccessful and longer than 5 days
        // Reset streakAwarded status
        await updateDoc(userRef, {
          streakAwarded: false,
          pointsAwarded: false, // Reset pointsAwarded to false
        });

        // Record the streak in a new collection with appropriate flags
        await addDoc(collection(db, "streaks"), {
          userId: auth.currentUser.uid,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          streakEnded: true, // Set streakEnded to true
          pointsGiven: false, // Set pointsGiven to false
        });

        // Reset the streak count to zero
        setCurrentStreak(0);
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchUserData} />
      }
    >
      <Text style={styles.headerText}>Rewards Dashboard</Text>
      <Text style={styles.subHeaderText}>
        Your progress and achievements, {userName}
      </Text>

      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>Points: {userPoints}</Text>
        <Text style={styles.userTypeText}>User Type: {userType}</Text>
      </View>

      <Text style={styles.motivationalMessage}>
        Finish more tasks on time to earn more points!
      </Text>

      {earnedBadge && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Earned Badge: {earnedBadge.name}</Text>
          <Image source={earnedBadge.image} style={styles.badgeImage} />
        </View>
      )}

      <Text style={styles.challengeDescription}>
        5 Days Challenge - Close a Task 5 Days in a Row to Get 100 Points!
      </Text>

      {currentStreak > 0 && (
        <Text style={styles.streakText}>
          Current Streak: {currentStreak} Days
        </Text>
      )}

      <View style={styles.streakBarContainer}>
        {Array.from({ length: maxStreak }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.streakDay,
              index < currentStreak
                ? styles.streakDayCompleted
                : styles.streakDayIncomplete,
            ]}
          />
        ))}
      </View>

      {successfulStreaks.length > 0 ? (
        <View style={styles.successfulStreaksContainer}>
          {successfulStreaks.map((streak, index) => (
            <View key={index} style={styles.streakItem}>
              <Text style={styles.streakText}>
                SuccesfulStreak:{" "}
                {new Date(streak.startDate).toLocaleDateString()} -{" "}
                {new Date(streak.endDate).toLocaleDateString()} | 100 Points
                Earned
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.timelineContainer}>
          {completedTasks.map((date, index) => (
            <View key={index} style={styles.dateItem}>
              <Text style={styles.dateText}>{date}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 65,
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 20,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  pointsContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  pointsText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#0782F9",
  },
  userTypeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 10,
  },
  motivationalMessage: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  badgeContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  badgeText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  badgeImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },

  streakBarContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  streakDay: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  streakDayCompleted: {
    backgroundColor: "#4CAF50", // Green for completed days
  },
  streakDayIncomplete: {
    backgroundColor: "#ddd", // Grey for incomplete days
  },
  challengeDescription: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFA500", // A vibrant orange color
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: "#FFA500",
    borderRadius: 10,
    backgroundColor: "#FFF3E0", // Light orange background for emphasis
  },
  timelineContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  dateItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  successfulStreaksContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#e6e6e6", // Light grey background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc", // Light grey border
  },
  streakItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd", // Light grey border for each item
  },
  streakText: {
    fontSize: 16,
    color: "#333", // Dark text color
    textAlign: "center", // Center-align text
  },
});

export default RewardsScreen;
