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
  setDoc,
  increment,
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
  const [monthlyTaskCount, setMonthlyTaskCount] = useState(0);
  const [monthlyRewardAwarded, setMonthlyRewardAwarded] = useState(false);
  const [monthlyRewardsHistory, setMonthlyRewardsHistory] = useState([]);

  const fetchUserData = async () => {
    setIsRefreshing(true);
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPoints(userData.points || 0);
        setUserName(userData.name || "");
        setUserType(getUserType(userData.points));
        setEarnedBadge(getEarnedBadge(userData.points));
        await fetchMonthlyTaskCount();
        await fetchMonthlyRewardsHistory();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchMonthlyTaskCount = async () => {
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const monthlyCompRef = doc(
      db,
      "monthlyCompetition",
      `${auth.currentUser.uid}_${currentYearMonth}`
    );

    const monthlyCompDoc = await getDoc(monthlyCompRef);

    // Check if a document for the current month exists
    if (!monthlyCompDoc.exists()) {
      // No document for the current month, create a new one and reset states
      await setDoc(monthlyCompRef, {
        userId: auth.currentUser.uid,
        taskCount: 0,
        rewardAwarded: false,
        yearMonth: currentYearMonth,
      });
      setMonthlyTaskCount(0);
      setMonthlyRewardAwarded(false);
    } else {
      // Document for the current month exists, continue with normal operation
      const startOfMonth = new Date();
      startOfMonth.setDate(1); // First day of the current month
      startOfMonth.setHours(0, 0, 0, 0); // Start of the day

      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      ); // Last moment of the current month

      const tasksRef = collection(db, "tasks");
      const q = query(
        tasksRef,
        where("userId", "==", auth.currentUser.uid),
        where("isCompleted", "==", true),
        where("pointsAwarded", "==", true),
        where("completedDate", ">=", startOfMonth.toISOString()),
        where("completedDate", "<=", endOfMonth.toISOString())
      );

      const querySnapshot = await getDocs(q);
      const monthlyTaskCount = querySnapshot.docs.length;
      setMonthlyTaskCount(monthlyTaskCount); // Update state with the count

      if (monthlyTaskCount >= 10 && !monthlyCompDoc.data().rewardAwarded) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newPoints = (userData.points || 0) + 100;
          await updateDoc(userRef, { points: newPoints });

          await updateDoc(monthlyCompRef, {
            userId: auth.currentUser.uid,
            taskCount: monthlyTaskCount,
            rewardAwarded: true,
            yearMonth: currentYearMonth, // Storing the year and month in the document
          });

          setUserPoints(newPoints);
          setMonthlyRewardAwarded(true);
        }
      }
    }
  };

  const fetchMonthlyRewardsHistory = async () => {
    const rewardsRef = collection(db, "monthlyCompetition");
    const q = query(
      rewardsRef,
      where("userId", "==", auth.currentUser.uid),
      where("rewardAwarded", "==", true)
    );

    try {
      const querySnapshot = await getDocs(q);
      const rewardsHistory = [];
      querySnapshot.forEach((doc) => {
        const monthYear = doc.id.split("_")[1];
        rewardsHistory.push(monthYear);
      });

      console.log("Fetched Rewards History:", rewardsHistory);
      setMonthlyRewardsHistory(rewardsHistory);
    } catch (error) {
      console.error("Error fetching monthly rewards history:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchMonthlyRewardsHistory();
  }, []);

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
    } catch (error) {
      console.error("Error fetching streak data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchSuccessfulStreaks();
  }, []);

  const getEarnedBadge = (points) => {
    return badges
      .slice()
      .reverse()
      .find((badge) => points >= badge.points);
  };

  const CounterDisplay = ({ count }) => {
    return (
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>{count}</Text>
      </View>
    );
  };

  function getUserType(points) {
    const type = userTypes.find(
      (type) => points >= type.minPoints && points <= type.maxPoints
    );
    return type ? type.name : "Unknown";
  }

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

      {/* Points and User Type */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>Points: {userPoints}</Text>
        <Text style={styles.userTypeText}>User Type: {userType}</Text>
      </View>

      {/* Earned Badge */}
      {earnedBadge && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Earned Badge: {earnedBadge.name}</Text>
          <Image source={earnedBadge.image} style={styles.badgeImage} />
        </View>
      )}

      {/* Separator Line and Monthly Competition Header */}
      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.competitionHeaderText}>Monthly Competition</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Monthly Task Counter Display */}
      <View style={styles.counterDisplayContainer}>
        <CounterDisplay count={monthlyTaskCount} />
        <Text style={styles.counterInfoText}>
          {monthlyTaskCount >= 10
            ? "Monthly goal achieved!"
            : `${10 - monthlyTaskCount} tasks left for 100 points`}
        </Text>
      </View>

      {/* Monthly Rewards History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyHeaderText}>Monthly Rewards History:</Text>
        {monthlyRewardsHistory.length > 0 ? (
          monthlyRewardsHistory.map((month, index) => (
            <Text key={index} style={styles.historyMonthText}>
              {month} - 100 Points Awarded
            </Text>
          ))
        ) : (
          <Text style={styles.historyEmptyText}>No Rewards Yet</Text>
        )}
      </View>
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
  monthlyTaskContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  monthlyTaskText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  rewardText: {
    fontSize: 16,
    color: "#4CAF50",
  },
  historyContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  historyHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  historyMonthText: {
    fontSize: 16,
    color: "#333",
  },
  historyEmptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  counterContainer: {
    padding: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 50,
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  counterText: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },
  counterDisplayContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  counterInfoText: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
    textAlign: "center",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  competitionHeaderText: {
    marginHorizontal: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});

export default RewardsScreen;
