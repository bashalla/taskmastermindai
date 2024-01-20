import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    } else {
      setSearchResults([]); // Clear results if search query is empty
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setIsLoading(true);
    const tasksRef = collection(db, "tasks");
    const categoriesRef = collection(db, "categories");
    const userId = auth.currentUser.uid;

    try {
      // Query tasks
      const qTasks = query(
        tasksRef,
        where("userId", "==", userId),
        where("name", ">=", searchQuery),
        where("name", "<=", searchQuery + "\uf8ff")
      );
      const taskSnapshot = await getDocs(qTasks);

      // Query categories
      const qCategories = query(
        categoriesRef,
        where("userId", "==", userId),
        where("name", ">=", searchQuery),
        where("name", "<=", searchQuery + "\uf8ff")
      );
      const categorySnapshot = await getDocs(qCategories);

      const results = [];
      taskSnapshot.forEach((doc) =>
        results.push({ ...doc.data(), id: doc.id, type: "Task" })
      );
      categorySnapshot.forEach((doc) =>
        results.push({ ...doc.data(), id: doc.id, type: "Category" })
      );

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }

    setIsLoading(false);
  };

  const navigateToItem = (item) => {
    if (item.type === "Task") {
      if (item.isCompleted) {
        // Navigate to CompletedTaskScreen for completed tasks
        navigation.navigate("CompletedTaskScreen", { task: item });
      } else {
        // Navigate to TaskDetailScreen for tasks not completed
        navigation.navigate("TaskDetailScreen", { task: item });
      }
    } else if (item.type === "Category") {
      // Navigate to EditCategoryScreen for categories
      navigation.navigate("EditCategoryScreen", { category: item });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Search</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search tasks or categories"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => navigateToItem(item)}
            >
              <Text style={styles.resultText}>
                {item.type}: {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    marginTop: 50,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
    marginTop: 50,
  },
  searchInput: {
    height: 70,
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginTop: 10,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Add additional styles as needed
});

export default SearchScreen;
