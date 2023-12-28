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
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import Icon from "react-native-vector-icons/MaterialIcons"; // Import Icon
import { db } from "../firebase";

const CreateTask = ({ navigation, route }) => {
  const { categoryId, categoryName } = route.params;
  const [tasks, setTasks] = useState([]);
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

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Task Name Input */}
      <View style={styles.inputContainer}>
        <Icon name="title" size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Task Name"
          value={taskName}
          onChangeText={setTaskName}
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputContainer}>
        <Icon name="description" size={20} style={styles.icon} />
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Description"
          multiline
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Location Input */}
      <View style={styles.inputContainer}>
        <Icon name="place" size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Document Picker */}
      <TouchableOpacity style={styles.button} onPress={selectDocument}>
        <Icon name="attach-file" size={20} color="white" />
        <Text style={styles.buttonText}>Select Document</Text>
      </TouchableOpacity>
      {document && <Text>Selected Document: {document.name}</Text>}

      {/* Deadline Picker */}
      <View style={styles.centeredView}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar-today" size={30} color="#0782F9" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={deadline}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onChangeDate}
          />
        )}
      </View>

      {/* Save and Cancel Buttons */}
      <TouchableOpacity style={styles.button} onPress={handleSaveTask}>
        <Text style={styles.buttonText}>Save Task</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f4f4f4",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  centeredView: {
    alignItems: "center", // Center align everything in this view
    marginVertical: 15, // Add some vertical spacing
  },
  iconButton: {
    marginBottom: 10, // Space between icon and date picker
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    flex: 1,
    borderRadius: 5,
    marginRight: 10, // Added margin to separate from icons
  },
  multilineInput: {
    height: 120, // Adjusted height for multiline input
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#0782F9",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "60%", // Reduced width
    alignSelf: "center", // Center align button
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "60%", // Reduced width
    alignSelf: "center", // Center align button
    marginBottom: 10,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "700",
  },
});

export default CreateTask;
