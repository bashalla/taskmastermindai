// SuggestionsPage.js
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

  // Function to refresh the suggestions
  const refreshSuggestions = async () => {
    setRefreshing(true);
    // Implement the logic to refresh suggestions
    // Once the refresh is complete, set refreshing to false
    setRefreshing(false);
  };

  // Use useEffect to refresh the suggestions when the page is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshSuggestions();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshSuggestions}
        />
      }
    >
      <Text style={styles.header}>Personalized Suggestions</Text>
      {suggestions.map((suggestion, index) => (
        <View key={index} style={styles.suggestionCard}>
          <Text style={styles.suggestionText}>{suggestion}</Text>
        </View>
      ))}
      <Button title="Back" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  suggestionCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  suggestionText: {
    fontSize: 18,
    color: "#333",
  },
});

export default SuggestionsPage;
