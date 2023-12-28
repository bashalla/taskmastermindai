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
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import Icon from "react-native-vector-icons/MaterialIcons"; // Import Icon
import { db } from "../firebase";
import * as Location from "expo-location";

const CreateTask = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [document, setDocument] = useState(null);
  const [location, setLocation] = useState("");
  const [selectedFileName, setSelectedFileName] = useState(""); // Added state for selected file name

  const uploadDocumentToFirebase = async (document) => {
    if (!document) return null;

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `taskDocuments/${document.name}`);
      const response = await fetch(document.uri);
      const blob = await response.blob();

      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // You can use this to show upload progress to the user
          },
          (error) => {
            // Handle unsuccessful uploads
            console.error("Error during upload: ", error);
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              console.log("File available at", downloadURL);
              resolve(downloadURL);
            });
          }
        );
      });
    } catch (error) {
      console.error("Error preparing document for upload: ", error);
      throw error;
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(
      `Lat: ${location.coords.latitude}, Long: ${location.coords.longitude}`
    );
  };

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
      categoryId,
    };

    try {
      // Upload document to Firebase Storage and get the URL (if a document is selected)
      if (document) {
        const documentUrl = await uploadDocumentToFirebase(document);
        taskData.documentUrl = documentUrl;
      }

      // Save the task to Firestore
      await addDoc(collection(db, "tasks"), taskData);
      Alert.alert("Task Created", "Your task has been created successfully.");

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
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      console.log("Document Picker Result:", result); // Log the entire result

      if (!result.cancelled && result.assets) {
        console.log("Selected document name:", result.assets[0].name); // Log the file name
        setDocument(result.assets[0]);
        setSelectedFileName(result.assets[0].name); // Update selected file name
      } else {
        console.log("Document selection was cancelled");
        setSelectedFileName(""); // Reset file name on cancel
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
          onFocus={getLocation} // Trigger location tracking when the user focuses on the input
          onChangeText={setLocation}
        />
      </View>

      {/* Document Picker */}
      <TouchableOpacity style={styles.button} onPress={selectDocument}>
        <Icon name="attach-file" size={20} color="white" />
        <Text style={styles.buttonText}>Select Document</Text>
      </TouchableOpacity>
      <View style={styles.selectedDocumentContainer}>
        <Text>Selected Document: {selectedFileName || "None"}</Text>
      </View>

      {/* Deadline Picker */}
      <View style={styles.centeredView}>
        <Text style={styles.headerText}>Deadline</Text>
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
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  icon: {
    marginRight: 10,
  },
  centeredView: {
    alignItems: "center",
    marginVertical: 15,
  },
  iconButton: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    flex: 1,
    borderRadius: 5,
    marginRight: 10,
  },
  multilineInput: {
    height: 120,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#0782F9",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    alignSelf: "center",
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
    width: "60%",
    alignSelf: "center",
    marginBottom: 10,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "700",
  },
  selectedDocumentContainer: {
    marginTop: 10,
    alignItems: "center",
  },
});

export default CreateTask;
