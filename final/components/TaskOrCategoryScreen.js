import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { db } from "../firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { auth } from "../firebase";

function TaskOrCategoryScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [refreshing, setRefreshing] = useState(false); // State for tracking refresh status
  const colors = ["#ff6347", "#4682b4", "#32cd32", "#ff69b4", "#ffa500"];

  const fetchCategories = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const categoriesRef = collection(db, "categories");
        const q = query(categoriesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const fetchedCategories = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCategories(fetchedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Failed to load categories.");
    }
    setRefreshing(false); // Set refreshing to false when fetch is complete
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories(); // Re-fetch categories
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newLabelName.trim() || !selectedColor) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const user = auth.currentUser; // Get the authenticated user

      if (!user) {
        // Handle the case where the user is not authenticated
        Alert.alert("Error", "User is not authenticated.");
        return;
      }

      const categoryData = {
        name: newCategoryName,
        label: newLabelName,
        color: selectedColor,
        userId: user.uid, // Include the user ID
      };

      const docRef = await addDoc(collection(db, "categories"), categoryData);
      setNewCategoryName("");
      setNewLabelName("");
      setSelectedColor("");

      // After creating the category, navigate to the "CreateTask" screen with the new category's ID
      navigation.navigate("CreateTask", {
        categoryId: docRef.id,
        from: "TaskOrCategoryScreen",
      });
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert("Error", "Failed to create a new category.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Category Selection</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Select an Existing Category</Text>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("CreateTask", {
                  categoryId: item.id,
                  from: "TaskOrCategoryScreen",
                })
              }
              style={[styles.category, { backgroundColor: item.color }]}
            >
              <Text style={styles.categoryText}>
                {item.name} - {item.label}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.noCategoriesContainer}>
              <Text style={styles.noCategoriesText}>
                There are no categories.
              </Text>
            </View>
          )}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <Text style={styles.subtitle}>Or Create a New Category</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Category Name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TextInput
            style={styles.input}
            placeholder="Label Name"
            value={newLabelName}
            onChangeText={setNewLabelName}
          />
        </View>
        <Text style={styles.colorSelectionText}>Select a Color:</Text>
        <View style={styles.colorContainer}>
          {colors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColor,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleCreateCategory}>
          <Text style={styles.buttonText}>+ Add Category</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    padding: 10,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: "#007aff",
    fontSize: 16,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  inputContainer: {
    width: "90%",
  },
  noCategoriesContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  noCategoriesText: {
    fontSize: 16,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: "100%",
  },
  colorSelectionText: {
    alignSelf: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "black",
  },
  category: {
    padding: 20,
    marginVertical: 5,
    borderRadius: 5,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  categoryText: {
    color: "white",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "90%",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  list: {
    width: "100%",
  },
});

export default TaskOrCategoryScreen;
