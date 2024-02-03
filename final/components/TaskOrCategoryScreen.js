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
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth > 768;

function TaskOrCategoryScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const colors = ["#2B2A4C", "#B31312", "#F4CE14", "#87C4FF", "#C5E898"];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setRefreshing(true);
    const q = query(
      collection(db, "categories"),
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const fetchedCategories = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCategories(fetchedCategories);
    setRefreshing(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newLabelName.trim() || !selectedColor) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "categories"), {
        name: newCategoryName,
        label: newLabelName,
        color: selectedColor,
        userId: auth.currentUser.uid,
      });
      setNewCategoryName("");
      setNewLabelName("");
      setSelectedColor("");
      Keyboard.dismiss(); // Dismiss the keyboard after submission
      fetchCategories(); // Refreshing the categories list
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert("Error", "Failed to create a new category.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Existing Categories List */}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchCategories}
            />
          }
        />

        {/* New Category Creation Form */}
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
    backgroundColor: "#F8FAE5",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: isTablet ? 24 : 20,
    marginBottom: 20,
    fontWeight: "bold",
    marginTop: isTablet ? 30 : 20,
    textAlign: "left",
    marginLeft: isTablet ? 30 : 20,
  },
  subtitle: {
    fontSize: isTablet ? 24 : 20,
    marginBottom: 20,
    fontWeight: "bold",
    marginTop: isTablet ? 30 : 20,
    textAlign: "left",
    marginLeft: isTablet ? 30 : 20,
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
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
  selectionText: {
    fontSize: isTablet ? 18 : 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: isTablet ? 15 : 2,
  },
  colorSelectionText: {
    alignSelf: "center",
    marginVertical: isTablet ? 15 : 10,
    fontWeight: "bold",
    fontSize: isTablet ? 18 : 16,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "black",
  },
  button: {
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
    fontSize: isTablet ? 20 : 16,
    fontWeight: "bold",
  },
  list: {
    width: "100%",
    marginBottom: 20,
  },
  noCategoriesContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  noCategoriesText: {
    fontSize: 16,
    color: "#666",
  },
  category: {
    padding: 20,
    marginVertical: 5,
    borderRadius: 5,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default TaskOrCategoryScreen;
