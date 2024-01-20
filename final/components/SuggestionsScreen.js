import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard"; // Use Expo's Clipboard API

const SuggestionsPage = ({ route, navigation }) => {
  const { suggestions } = route.params;

  // Define a set of colors for the cards
  const cardColors = ["#B0C4DE", "#778899", "#708090", "#A9A9A9", "#2F4F4F"];

  // Function to render each item of the suggestions in a separate card
  const renderSuggestionCards = () => {
    let cardIndex = 0;
    return suggestions.flatMap((suggestion, index) =>
      suggestion
        .split(".") // Split by dot
        .map((item) => item.trim()) // Trim whitespace
        .filter((item) => item && !item.match(/^\d+\.?$/)) // Filter out standalone numbers, with or without a trailing dot
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
              onPress={async () => {
                await Clipboard.setStringAsync(cleanItem);
                // Optionally, you can show a confirmation message here
              }}
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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Personalized Suggestions</Text>
      {renderSuggestionCards()}
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          color="#007AFF"
        />
      </View>
      {/* "+" Icon for adding new tasks or categories */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={navigateToTaskCreation}
      >
        <Icon name="add-circle-outline" size={50} color="#0782F9" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 70,
    paddingTop: 40,
    paddingHorizontal: 15,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#1A1A1A",
    paddingTop: 20,
  },
  suggestionCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  suggestionText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 5,
  },
  buttonContainer: {
    margin: 20,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
});

export default SuggestionsPage;
