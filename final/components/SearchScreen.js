import React, { useState } from "react";
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

  const handleSearch = async () => {
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
        onSubmitEditing={handleSearch}
      />
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              <Text>
                {item.type}: {item.name}
              </Text>
            </View>
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
    marginTop: 40,
  },
  backButton: {
    marginTop: 50,
    marginRight: 10, // Adjust spacing as needed
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
  },
  searchInput: {
    height: 50,
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
    marginTop: 20,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginTop: 10,
  },
});

export default SearchScreen;
