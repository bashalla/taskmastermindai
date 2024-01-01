import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
  Alert,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import { db } from "../firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialIcons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "@env";
import * as Calendar from "expo-calendar";

const TaskDetailsScreen = ({ navigation, route }) => {
  const { task } = route.params;
  const [taskName, setTaskName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [deadline, setDeadline] = useState(new Date(task.deadline));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documentUrls, setDocumentUrls] = useState(task.documentUrls || []);
  const [region, setRegion] = useState({
    latitude: task.location ? task.location.latitude : 0,
    longitude: task.location ? task.location.longitude : 0,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }
    })();
  }, []);

  const updateTaskAndCalendarEvent = async (
    taskId,
    newDeadline,
    calendarEventId
  ) => {
    try {
      // Retrieve the current task data
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);
      const taskData = taskDoc.data();

      // Convert deadlines to Date objects for accurate comparison
      const oldDeadline = new Date(taskData.deadline);
      const newDeadlineDate = new Date(newDeadline);

      // Check if the deadline has actually changed
      // Compare the time values of the dates
      if (oldDeadline.getTime() !== newDeadlineDate.getTime()) {
        // Increment deadlineChangeCount
        const newCount = (taskData.deadlineChangeCount || 0) + 1;

        // Update the task in Firestore
        await updateDoc(taskRef, {
          deadline: newDeadlineDate.toISOString(),
          deadlineChangeCount: newCount,
        });

        // Update the calendar event if an ID is provided
        if (calendarEventId) {
          await updateCalendarEvent(calendarEventId, newDeadlineDate);
        }

        console.log("Task and calendar event updated successfully");
        // Additional code to handle the successful update (e.g., user feedback)
      }
    } catch (error) {
      console.error("Error updating task and calendar event:", error);
      // Additional code to handle the error (e.g., user feedback)
    }
  };

  const updateCalendarEvent = async (eventId, newDeadline) => {
    try {
      let startDate = new Date(newDeadline);
      startDate.setMinutes(
        startDate.getMinutes() + startDate.getTimezoneOffset()
      );
      startDate.setHours(0, 0, 0, 0);

      await Calendar.updateEventAsync(eventId, {
        startDate: startDate,
        endDate: startDate,
        allDay: true,
      });

      console.log("Calendar event updated successfully");
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error; // Rethrow the error to be caught by the calling function
    }
  };

  const handleSave = async () => {
    try {
      if (!taskName || !description) {
        Alert.alert("Error", "Please fill in all the required fields.");
        return;
      }

      // Prepare updated task data
      const updatedTask = {
        name: taskName,
        description,
        deadline: deadline.toISOString(),
        documentUrls,
        location: region,
      };

      // Update task in Firestore and the associated calendar event
      if (task.calendarEventId) {
        await updateTaskAndCalendarEvent(
          task.id,
          deadline,
          task.calendarEventId
        );
      } else {
        // Update task in Firestore
        const taskRef = doc(db, "tasks", task.id);
        await updateDoc(taskRef, updatedTask);
      }

      Alert.alert("Task Updated", "Your task has been updated successfully.");
      if (route.params?.onTaskUpdate) {
        route.params.onTaskUpdate();
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "There was an error updating the task.");
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      // Check if the document picker was cancelled or if no files were selected
      if (result.cancelled || !result.assets) {
        return;
      }

      // Upload each selected document and get their download URLs
      const newDocumentUrls = await Promise.all(
        result.assets.map(async (document) => {
          const storage = getStorage();
          const storageRef = ref(storage, `taskDocuments/${document.name}`);
          const response = await fetch(document.uri);
          const blob = await response.blob();

          const uploadTask = uploadBytesResumable(storageRef, blob);

          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                // Optional: Handle upload progress
              },
              (error) => {
                reject(error);
              },
              () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                  resolve({ name: document.name, url: downloadURL });
                });
              }
            );
          });
        })
      );

      // Update the state to include the URLs of the newly uploaded documents
      setDocumentUrls([...documentUrls, ...newDocumentUrls]);
    } catch (error) {
      console.error("Error during document upload:", error);
      Alert.alert("Upload Error", "There was an error uploading the document.");
    }
  };

  const deleteDocument = (index) => {
    setDocumentUrls(documentUrls.filter((_, i) => i !== index));
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

      {/* Location Input with GooglePlacesAutocomplete */}
      <GooglePlacesAutocomplete
        placeholder="Update Location"
        fetchDetails={true}
        onPress={(data, details = null) => {
          setRegion({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: "en",
        }}
        styles={{
          textInput: styles.input,
          // Additional styles if needed
        }}
      />

      {/* Map View */}
      <View style={styles.mapContainer}>
        {region && (
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation={true}
          >
            <Marker coordinate={region} />
          </MapView>
        )}
      </View>

      {/* Document Handling */}
      <View style={styles.selectedDocumentContainer}>
        {documentUrls.map((doc, index) => (
          <View key={index} style={styles.documentRow}>
            <TouchableOpacity onPress={() => Linking.openURL(doc.url)}>
              <Text>{doc.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteDocument(index)}>
              <Text style={styles.deleteText}>x</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={handleDocumentUpload}>
          <Text>Add/Update Document</Text>
        </TouchableOpacity>
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
            minimumDate={new Date()} // Set the minimum date to the current date
            onChange={(event, selectedDate) => {
              const currentDate = selectedDate || deadline;
              setShowDatePicker(Platform.OS === "ios");

              // Adjust the selected date to the end of the day
              const adjustedDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                23,
                59,
                59 // Set to the last moment of the day
              );

              setDeadline(adjustedDate);
            }}
          />
        )}
      </View>

      {/* Save and Cancel Buttons */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Task</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
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
    justifyContent: "center", // Add this line if it's not already there
    marginVertical: 15,
  },
  iconButton: {
    alignItems: "center", // Center the icon vertically in the button
    justifyContent: "center", // Center the icon horizontally in the button
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
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Adjust for spacing
    marginBottom: 5,
    padding: 5, // Add padding for better touch area
    // ... [Other styling as needed]
  },
  deleteIcon: {
    marginLeft: 10,
    // Add more styling as needed
  },
  deleteText: {
    color: "red",
    fontWeight: "bold",
    fontSize: 20, // Increase font size
    paddingHorizontal: 10, // Add horizontal padding for easier touch
    // ... [Other styling as needed]
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
  mapContainer: {
    height: 300, // Adjust the height as needed
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10, // Reduce the margin
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  textInputContainer: {
    backgroundColor: "grey",
    marginBottom: 10, // Reduce the margin
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10, // Reduce the margin
  },
});

export default TaskDetailsScreen;
