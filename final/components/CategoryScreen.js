import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  View,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons"; // Import Material Icons or any other icon library
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
} from "firebase/firestore";

// This component will be used to create a new category
const CategoryScreen = ({ navigation }) => {
  const [categoryName, setCategoryName] = useState("");
  const [labelName, setLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [categories, setCategories] = useState([]);

  const handleCategoryClick = (categoryId, categoryName) => {
    navigation.navigate("TaskScreen", { categoryId, categoryName });
  };

  const colors = ["#ff6347", "#4682b4", "#32cd32", "#ff69b4", "#ffa500"];

  // Fetch categories when the screen loads
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchCategories(); // Fetch categories again when the screen is focused
    });
    return unsubscribe;
  }, [navigation]);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    const q = query(
      collection(db, "categories"),
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const fetchedCategories = [];
    querySnapshot.forEach((doc) => {
      fetchedCategories.push({ ...doc.data(), id: doc.id });
    });
    setCategories(fetchedCategories);
  };

  // Create a new category in Firestore
  const handleCreateCategory = async () => {
    if (!categoryName.trim() || !labelName.trim() || !selectedColor) {
      alert("Please fill in all fields.");
      return;
    }

    // Add a new document with a generated id.
    await addDoc(collection(db, "categories"), {
      name: categoryName,
      label: labelName,
      color: selectedColor,
      userId: auth.currentUser.uid,
    });
    setCategoryName("");
    setLabelName("");
    setSelectedColor("");
    fetchCategories();
  };

  // Delete a category and all associated tasks
  const handleDeleteCategory = async (categoryId) => {
    Alert.alert(
      "Confirm Delete",
      "Do you really want to delete this category and all associated tasks?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => deleteCategoryAndTasks(categoryId) },
      ]
    );
  };

  const deleteCategoryAndTasks = async (categoryId) => {
    const batch = writeBatch(db);

    // Delete the category
    const categoryRef = doc(db, "categories", categoryId);
    batch.delete(categoryRef);

    const tasksQuery = query(
      collection(db, "tasks"),
      where("categoryId", "==", categoryId)
    );

    try {
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Commit the batch
      await batch.commit();
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category and tasks: ", error);
      Alert.alert(
        "Error",
        "There was a problem deleting the category and tasks."
      );
    }
  };

  // Edit a category
  const handleEditCategory = (category) => {
    navigation.navigate("EditCategoryScreen", { category });
  };

  // Render the screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Category Name"
            value={categoryName}
            onChangeText={setCategoryName}
          />
          <TextInput
            style={styles.input}
            placeholder="Label Name"
            value={labelName}
            onChangeText={setLabelName}
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
      </ScrollView>
      <FlatList
        style={styles.flatList}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[styles.category, { backgroundColor: item.color }]}
              onPress={() => handleCategoryClick(item.id, item.name)}
              onLongPress={() => handleDeleteCategory(item.id)}
            >
              <Text style={styles.categoryText}>
                {item.name} - {item.label}
              </Text>
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <TouchableOpacity
                onPress={() => handleEditCategory(item)}
                style={styles.iconButton}
              >
                <MaterialIcons name="edit" size={24} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteCategory(item.id)}
                style={styles.iconButton}
              >
                <MaterialIcons name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    marginTop: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    width: "90%",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignSelf: "center",
  },
  colorSelectionText: {
    alignSelf: "center",
    marginVertical: 10,
    fontWeight: "bold",
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
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
  button: {
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    width: "90%",
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  flatList: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    flex: 1,
    padding: 20,
    marginVertical: 5,
    borderRadius: 5,
    alignSelf: "center",
  },
  categoryText: {
    color: "white",
    fontWeight: "bold",
  },
  iconContainer: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
});

export default CategoryScreen;
