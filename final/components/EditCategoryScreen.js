import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
  Alert,
} from "react-native";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const EditCategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [categoryName, setCategoryName] = useState(category.name);
  const [labelName, setLabelName] = useState(category.label);
  const [selectedColor, setSelectedColor] = useState(category.color);

  const colors = ["#ff6347", "#4682b4", "#32cd32", "#ff69b4", "#ffa500"];

  const handleUpdateCategory = async () => {
    if (!categoryName.trim() || !labelName.trim() || !selectedColor) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const categoryRef = doc(db, "categories", category.id);
    await updateDoc(categoryRef, {
      name: categoryName,
      label: labelName,
      color: selectedColor,
    });

    Alert.alert("Success", "Category updated successfully.");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.header}>Edit Category</Text>
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

        <TouchableOpacity style={styles.button} onPress={handleUpdateCategory}>
          <Text style={styles.buttonText}>Update Category</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f4f4f4", // you can change the background color as needed
  },
  scrollView: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    width: "90%",
    alignSelf: "center",
  },
  colorSelectionText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginVertical: 10,
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "white", // Change as needed
  },
  selectedColor: {
    borderColor: "black",
  },
  button: {
    backgroundColor: "#0782F9",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    alignSelf: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default EditCategoryScreen;
