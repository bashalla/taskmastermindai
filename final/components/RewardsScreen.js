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
import { doc, getDoc } from "firebase/firestore";
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

function RewardsScreen() {
  const [userPoints, setUserPoints] = useState(0);
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUserData = async () => {
    setIsRefreshing(true); // Start the refresh animation
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUserPoints(userData.points);
        setUserName(userData.firstName);
        setUserType(getUserType(userData.points));
        setEarnedBadge(getEarnedBadge(userData.points));
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsRefreshing(false); // End the refresh animation
    }
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

  const getEarnedBadge = (points) => {
    return badges
      .slice()
      .reverse()
      .find((badge) => points >= badge.points);
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

      {/* Additional UI elements can be added here */}
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
});

export default RewardsScreen;
