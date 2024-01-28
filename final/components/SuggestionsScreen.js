import React, { useState } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const SuggestionsPage = ({ route, navigation }) => {
  const { suggestions } = route.params;

  const cardColors = ["#B19470", "#43766C", "#76453B", "#A9A9A9", "#2F4F4F"];

  const [copiedText, setCopiedText] = useState("");

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setCopiedText(text);

    // Show a toast on Android or an alert on iOS
    if (Platform.OS === "android") {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Text copied to clipboard", [
        { text: "OK", onPress: () => {} },
      ]);
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.cardsContainer}>
        <Text style={styles.header}>Personalized Suggestions</Text>
        {renderSuggestionCards()}
      </ScrollView>
      <TouchableOpacity
        style={styles.addButton}
        onPress={navigateToTaskCreation}
      >
        <Icon name="add-circle-outline" size={wp("10%")} color="#0782F9" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAE5",
  },
  header: {
    fontSize: wp("6%"),
    fontWeight: "bold",
    marginBottom: hp("2%"),
    textAlign: "center",
    color: "#1A1A1A",
    paddingTop: hp("2%"),
  },
  cardsContainer: {
    flex: 1,
    paddingTop: hp("5%"),
    paddingHorizontal: wp("5%"),
  },
  suggestionCard: {
    padding: wp("4%"),
    borderRadius: wp("3%"),
    marginBottom: hp("2%"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp("1%") },
    shadowOpacity: 0.2,
    shadowRadius: wp("2%"),
    elevation: 5,
  },
  suggestionText: {
    fontSize: wp("4%"),
    color: "#333",
    marginBottom: hp("1%"),
  },
  addButton: {
    position: "absolute",
    right: wp("5%"),
    bottom: hp("12%"),
  },
});

export default SuggestionsPage;
