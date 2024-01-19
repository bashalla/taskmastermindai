import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  RefreshControl,
} from "react-native";

const SuggestionsPage = ({ route, navigation }) => {
  const { suggestions } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const refreshSuggestions = async () => {
    setRefreshing(true);
    // Add logic to refresh suggestions here if needed
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshSuggestions();
    });
    return unsubscribe;
  }, [navigation]);

  // Define a set of more serious colors for the cards
  const cardColors = ["#B0C4DE", "#778899", "#708090", "#A9A9A9", "#2F4F4F"];

  // Function to render each item of the suggestions in a separate card
  const renderSuggestionCards = () => {
    let cardIndex = 0;
    return suggestions.flatMap((suggestion, index) =>
      suggestion
        .split(".") // Split by dot
        .map((item) => item.trim()) // Trim whitespace
        .filter((item) => item && !item.match(/^\d+$/)) // Filter out empty items and standalone numbers
        .map((cleanItem, idx) => {
          const cardStyle = {
            ...styles.suggestionCard,
            backgroundColor: cardColors[cardIndex % cardColors.length],
          };
          cardIndex++;
          return (
            <View key={`${index}-${idx}`} style={cardStyle}>
              <Text style={styles.suggestionText}>{cleanItem}</Text>
            </View>
          );
        })
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshSuggestions}
        />
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <Text style={styles.header}>Personalized Suggestions</Text>
      {renderSuggestionCards()}
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          color="#007AFF"
        />
      </View>
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
});

export default SuggestionsPage;
