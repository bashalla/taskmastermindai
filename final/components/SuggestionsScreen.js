import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  TouchableOpacity,
  Alert,
  Platform,
  ToastAndroid,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
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

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;

const SuggestionsPage = ({ route, navigation }) => {
  const { suggestions } = route.params;

  const cardColors = ["#B19470", "#43766C", "#76453B", "#A9A9A9", "#2F4F4F"];

  const [copiedText, setCopiedText] = useState("");
  const [userName, setUserName] = useState("");

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setCopiedText(text);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Text copied to clipboard", [
        { text: "OK", onPress: () => {} },
      ]);
    }
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

  const renderSuggestionCards = () => {
    let cardIndex = 0;
    return suggestions.flatMap((suggestion, index) =>
      suggestion
        .split(".")
        .map((item) => item.trim())
        .filter((item) => item && !item.match(/^\d+\.?$/))
        .map((cleanItem, idx) => {
          const cardStyle = {
            ...styles.suggestionCard,
            backgroundColor: cardColors[cardIndex % cardColors.length],
          };
          cardIndex++;
          return (
            <TouchableOpacity
              key={`${index}-${idx}`}
              style={cardStyle}
              onPress={() => copyToClipboard(cleanItem)}
            >
              <Text style={styles.suggestionText}>{cleanItem}</Text>
            </TouchableOpacity>
          );
        })
    );
  };

  const navigateToTaskCreation = () => {
    navigation.navigate("TaskOrCategoryScreen");
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.cardsContainer}>
        <Text style={styles.header}>Hello, {userName}!</Text>
        <Text style={styles.subheader}>
          Find your personal Task Suggestions below:
        </Text>

        {renderSuggestionCards()}
      </ScrollView>
      <TouchableOpacity
        style={styles.addButton}
        onPress={navigateToTaskCreation}
        testID="addButton"
      >
        <Icon name="add-circle-outline" size={wp("10%")} color="#0782F9" />
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAE5",
  },
  header: {
    fontSize: isTablet ? wp("4%") : wp("5%"),
    fontWeight: "bold",
    textAlign: "left",
    color: "#1A1A1A",
    paddingTop: isTablet ? hp("1%") : hp("2%"),
    marginBottom: isTablet ? hp("1%") : hp("5%"),
  },
  subheader: {
    fontSize: isTablet ? wp("3.5%") : wp("4%"),
    marginBottom: isTablet ? hp("3%") : hp("3%"),
    textAlign: "left",
    color: "#1A1A1A",
    paddingTop: isTablet ? hp("1%") : hp("2%"),
  },
  cardsContainer: {
    flex: 1,
    paddingTop: isTablet ? hp("3%") : hp("5%"),
    paddingHorizontal: isTablet ? wp("4%") : wp("5%"),
  },
  suggestionCard: {
    padding: isTablet ? wp("3%") : wp("4%"),
    borderRadius: isTablet ? wp("2%") : wp("3%"),
    marginBottom: isTablet ? hp("1.5%") : hp("2%"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: isTablet ? hp("0.5%") : hp("1%") },
    shadowOpacity: 0.2,
    shadowRadius: isTablet ? wp("1.5%") : wp("2%"),
    elevation: 5,
  },
  suggestionText: {
    fontSize: isTablet ? wp("3.5%") : wp("4%"),
    color: "#333",
    marginBottom: isTablet ? hp("0.5%") : hp("1%"),
  },
  addButton: {
    position: "absolute",
    right: wp("5%"),
    bottom: isTablet ? hp("5%") : hp("8%"),
  },
});

export default SuggestionsPage;
