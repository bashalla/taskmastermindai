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
  Vibration,
  Dimensions,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;

// This component will be used to create a new category
const CategoryScreen = ({ navigation }) => {
  const [categoryName, setCategoryName] = useState("");
  const [labelName, setLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [categories, setCategories] = useState([]);

  const handleCategoryClick = (categoryId, categoryName) => {
    navigation.navigate("TaskScreen", { categoryId, categoryName });
  };

  const colors = ["#2B2A4C", "#B31312", "#F4CE14", "#87C4FF", "#C5E898"];

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

    Keyboard.dismiss(); // Dismiss the keyboard

    const categoryCreateHaptic = [200];
    Vibration.vibrate(categoryCreateHaptic);

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
      <Text style={styles.sectionHeader}>Create New Category</Text>

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

      <TouchableOpacity
        style={styles.roundButton}
        onPress={handleCreateCategory}
      >
        <Text style={styles.buttonText}>+ Add Category</Text>
      </TouchableOpacity>
      <Text style={styles.sectionCategory}>Existing Categories</Text>

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
    backgroundColor: "#F8FAE5",
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    marginTop: isTablet ? 30 : 20,
  },
  sectionHeader: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    marginTop: isTablet ? 30 : 20,
    textAlign: "left",
    marginLeft: isTablet ? 30 : 20,
  },
  sectionCategory: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    marginTop: isTablet ? 30 : 40,
    textAlign: "left",
    marginLeft: isTablet ? 30 : 20,
  },
  input: {
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: isTablet ? 15 : 25,
    padding: isTablet ? 15 : 10,
    fontSize: isTablet ? 18 : 16,
    marginBottom: isTablet ? 15 : 7,
    width: isTablet ? "80%" : "95%",
    alignSelf: "center",
  },
  colorSelectionText: {
    alignSelf: "center",
    marginVertical: isTablet ? 15 : 10,
    fontWeight: "bold",
    fontSize: isTablet ? 18 : 16,
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: isTablet ? 15 : 2,
  },
  colorOption: {
    width: isTablet ? 40 : 30,
    height: isTablet ? 40 : 30,
    borderRadius: isTablet ? 20 : 15,
    marginHorizontal: 5,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "black",
  },
  button: {
    backgroundColor: "#0782F9",
    padding: isTablet ? 20 : 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: isTablet ? 25 : 20,
    width: isTablet ? "70%" : "90%",
    alignSelf: "center",
  },
  roundButton: {
    backgroundColor: "#0782F9",
    padding: isTablet ? 20 : 15,
    borderRadius: isTablet ? 25 : 30,
    alignItems: "center",
    justifyContent: "center",
    width: isTablet ? "50%" : "60%",
    alignSelf: "center",
    marginTop: isTablet ? 25 : 20,
  },
  buttonText: {
    color: "white",
    fontSize: isTablet ? 20 : 18,
    fontWeight: "bold",
  },
  flatList: {
    flex: 1,
  },
  categoryContainer: {
    marginTop: isTablet ? 25 : 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    flex: 1,
    padding: isTablet ? 25 : 20,
    borderRadius: 5,
    alignSelf: "center",
    marginLeft: 3,
  },
  categoryText: {
    color: "white",
    fontWeight: "bold",
    fontSize: isTablet ? 18 : 16,
  },
  iconContainer: {
    flexDirection: "row",
  },
  iconButton: {
    padding: isTablet ? 7 : 5,
    marginLeft: 10,
  },
});

export default CategoryScreen;
