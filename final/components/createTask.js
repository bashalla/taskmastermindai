import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
  Alert,
  Button,
  Platform,
} from "react-native";
import { addDoc, collection } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { db } from "../firebase";

const CreateTask = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [document, setDocument] = useState(null);
  const [location, setLocation] = useState("");

  const handleSaveTask = async () => {
    // Validate input fields
    if (!taskName || !description) {
      Alert.alert("Error", "Please fill in all the required fields.");
      return;
    }

    // Prepare task data
    const taskData = {
      name: taskName,
      description,
      deadline: deadline.toISOString(),
      location,
      categoryId, // Make sure this matches the category you are filtering in TaskScreen
      // Add document URL if you've uploaded a document
      // documentUrl: 'URL of the uploaded document' // Uncomment and use the actual URL after uploading
    };

    try {
      // Upload document to Firebase Storage and get the URL (if a document is selected)
      let documentUrl = "";
      if (document) {
        // Assuming you have a function to handle the upload and it returns the URL
        documentUrl = await uploadDocumentToFirebase(document);
        taskData.documentUrl = documentUrl;
      }

      // Save the task to Firestore
      await addDoc(collection(db, "tasks"), taskData);
      Alert.alert("Task Created", "Your task has been created successfully.");

      // Call the onGoBack function passed through navigation params to refresh the task list
      if (route.params?.onGoBack) {
        route.params.onGoBack();
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "There was an error saving the task.");
    }
  };

  const selectDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });

      if (result.type === "success") {
        setDocument(result);
        // Further processing like uploading to Firebase Storage
      }
    } catch (err) {
      console.error("Error picking a document:", err);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(Platform.OS === "ios");
    setDeadline(currentDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Task Name"
        value={taskName}
        onChangeText={setTaskName}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TouchableOpacity style={styles.button} onPress={selectDocument}>
        <Text style={styles.buttonText}>Select Document</Text>
      </TouchableOpacity>
      {document && <Text>Selected Document: {document.name}</Text>}

      <Button title="Select Deadline" onPress={() => setShowDatePicker(true)} />
      {showDatePicker && (
        <DateTimePicker
          value={deadline}
          mode="date"
          display="default"
          minimumDate={new Date()} // Set the minimum date to the current date
          onChange={onChangeDate}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSaveTask}>
        <Text style={styles.buttonText}>Save Task</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
});

export default CreateTask;
