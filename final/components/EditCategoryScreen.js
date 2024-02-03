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
  Platform,
  Dimensions,
} from "react-native";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;

// This component will be used to edit an existing category
const EditCategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [categoryName, setCategoryName] = useState(category.name);
  const [labelName, setLabelName] = useState(category.label);
  const [selectedColor, setSelectedColor] = useState(category.color);

  const colors = ["#2B2A4C", "#B31312", "#F4CE14", "#87C4FF", "#C5E898"];

  // Setting the header title and making sure the header is shown
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Edit Category",
    });
  }, [navigation]);

  // Update the category in Firestore
  const handleUpdateCategory = async () => {
    if (!categoryName.trim() || !labelName.trim() || !selectedColor) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const categoryRef = doc(db, "categories", category.id);
      await updateDoc(categoryRef, {
        name: categoryName,
        label: labelName,
        color: selectedColor,
      });

      Alert.alert("Success", "Category updated successfully.");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating category: ", error);
      Alert.alert("Error", "There was a problem updating the category.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionHeader}>Edit Category</Text>

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
    backgroundColor: "#F8FAE5",
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    marginTop: isTablet ? 30 : 20,
    textAlign: "left",
    marginLeft: isTablet ? 30 : 20,
    marginBottom: isTablet ? 30 : 20,
  },
  input: {
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: isTablet ? 15 : 25,
    padding: isTablet ? 15 : 10,
    fontSize: isTablet ? 18 : 16,
    marginBottom: isTablet ? 15 : 12,
    width: isTablet ? "80%" : "95%",
    alignSelf: "center",
  },
  colorSelectionText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: isTablet ? 18 : 16,
    marginVertical: isTablet ? 15 : 10,
  },
  colorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: isTablet ? 20 : 10,
  },
  colorOption: {
    width: isTablet ? 50 : 40,
    height: isTablet ? 50 : 40,
    borderRadius: isTablet ? 25 : 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "white",
  },
  selectedColor: {
    borderColor: "black",
  },
  button: {
    backgroundColor: "#0782F9",
    padding: isTablet ? 20 : 15,
    borderRadius: isTablet ? 25 : 30,
    alignItems: "center",
    justifyContent: "center",
    width: isTablet ? "70%" : "60%",
    alignSelf: "center",
    marginTop: isTablet ? 25 : 20,
  },
  buttonText: {
    color: "white",
    fontSize: isTablet ? 20 : 18,
    fontWeight: "bold",
  },
});

export default EditCategoryScreen;
