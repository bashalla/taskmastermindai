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
} from "react-native";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import TaskCreationScreen from "./TaskScreen";

const CategoryScreen = ({ navigation }) => {
  const [categoryName, setCategoryName] = useState("");
  const [labelName, setLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [categories, setCategories] = useState([]);

  // Add this function to navigate to the TaskCreationScreen with category information.
  const handleCategoryClick = (categoryId, categoryName) => {
    navigation.navigate("TaskCreation", { categoryId, categoryName });
  };

  // Predefined colors
  const colors = ["#ff6347", "#4682b4", "#32cd32", "#ff69b4", "#ffa500"]; // Add more colors as needed

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleCreateCategory = async () => {
    if (!categoryName.trim() || !labelName.trim() || !selectedColor) {
      alert("Please fill in all fields.");
      return;
    }

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
          <TouchableOpacity
            style={[styles.category, { backgroundColor: item.color }]}
            onPress={() => handleCategoryClick(item.id, item.name)}
          >
            <Text style={styles.categoryText}>
              {item.name} - {item.label}
            </Text>
          </TouchableOpacity>
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
    marginTop: 100, // Adjust the marginTop value to move input fields further down
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
  category: {
    padding: 20,
    marginVertical: 5,
    width: "90%",
    borderRadius: 5,
    alignSelf: "center",
  },
  categoryText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CategoryScreen;
