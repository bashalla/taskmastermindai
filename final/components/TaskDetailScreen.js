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
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Keyboard,
  ActivityIndicator,
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

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;

const TaskDetailsScreen = ({ navigation, route }) => {
  const { task } = route.params;
  const [taskName, setTaskName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [deadline, setDeadline] = useState(new Date(task.deadline));
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [documentUrls, setDocumentUrls] = useState(task.documentUrls || []);
  const [region, setRegion] = useState({
    latitude: task.location ? task.location.latitude : 0,
    longitude: task.location ? task.location.longitude : 0,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLocationInputFocused, setIsLocationInputFocused] = useState(false);
  const [googlePlacesInputFocused, setGooglePlacesInputFocused] =
    useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }
    })();
  }, []);

  // Additional useEffect for keyboard event listeners to make keyboard up
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const updateTaskAndCalendarEvent = async (
    taskId,
    newDeadline,
    calendarEventId
  ) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);
      const taskData = taskDoc.data();

      const oldDeadline = new Date(taskData.deadline);
      const newDeadlineDate = new Date(newDeadline);

      // Check if the deadline has actually changed
      if (oldDeadline.getTime() !== newDeadlineDate.getTime()) {
        // Increment deadlineChangeCount
        const newCount = (taskData.deadlineChangeCount || 0) + 1;

        await updateDoc(taskRef, {
          deadline: newDeadlineDate.toISOString(),
          deadlineChangeCount: newCount,
        });

        console.log("Deadline updated. New count: ", newCount);

        if (calendarEventId) {
          await updateCalendarEvent(calendarEventId, newDeadlineDate);
        }
      } else {
        console.log("No change in deadline detected.");
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const updateCalendarEvent = async (eventId, newDeadline) => {
    try {
      let startDate = new Date(newDeadline);
      // Create a UTC date at the start of the day
      let utcStartDate = new Date(
        Date.UTC(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        )
      );

      await Calendar.updateEventAsync(eventId, {
        startDate: utcStartDate,
        endDate: utcStartDate,
        allDay: true,
      });

      console.log("Calendar event updated successfully");
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      if (!taskName || !description) {
        Alert.alert("Error", "Please fill in all the required fields.");
        return;
      }

      // Retrieve the current task data to compare deadlines
      const taskRef = doc(db, "tasks", task.id);
      const taskDoc = await getDoc(taskRef);
      const taskData = taskDoc.data();

      const oldDeadline = new Date(taskData.deadline);
      const newDeadlineDate = new Date(deadline);

      // Prepare the base updated task data
      const updatedTask = {
        name: taskName,
        description,
        deadline: newDeadlineDate.toISOString(),
        documentUrls,
        location: region,
      };

      // Check if the deadline has changed
      if (oldDeadline.getTime() !== newDeadlineDate.getTime()) {
        // Increment deadlineChangeCount
        const newCount = (taskData.deadlineChangeCount || 0) + 1;
        updatedTask.deadlineChangeCount = newCount; // Update deadlineChangeCount in updated task
      }

      // Update task in Firestore
      await updateDoc(taskRef, updatedTask);

      // Optionally, update the calendar event if there's an associated ID
      if (task.calendarEventId && task.calendarEventId !== "") {
        await updateCalendarEvent(task.calendarEventId, newDeadlineDate);
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
    // Adjustinging the maximum number of documents allowed based on the platform
    const maxDocumentsAllowed = Platform.OS === "ios" ? 2 : 1; // 2 documents for iOS, 1 for Android

    if (documentUrls.length >= maxDocumentsAllowed) {
      Alert.alert(
        "Limit Reached",
        `You can only upload up to ${maxDocumentsAllowed} attachment${
          maxDocumentsAllowed > 1 ? "s" : ""
        }.`
      );
      return;
    }

    setIsUploading(true); // Start uploading

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: Platform.OS === "ios", // Enable multiple selection only for iOS
      });

      if (result.cancelled) {
        setIsUploading(false); // End uploading if cancelled
        return;
      }

      // For Android, ensure only the first selected document is considered, even if multiple were somehow selected by the user
      // For iOS, accept multiple documents up to the remaining limit of 2
      const newDocuments =
        Platform.OS === "android"
          ? [result]
          : result.assets.slice(0, maxDocumentsAllowed - documentUrls.length);

      const newDocumentUrls = await Promise.all(
        newDocuments.map(async (document) => {
          const storage = getStorage();
          const storageRef = ref(storage, `taskDocuments/${document.name}`);
          const response = await fetch(document.uri);
          const blob = await response.blob();

          const uploadTask = uploadBytesResumable(storageRef, blob);

          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null, // Progress handler could be added here
              (error) => {
                console.error("Upload error: ", error);
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

      setDocumentUrls((currentUrls) =>
        [...currentUrls, ...newDocumentUrls].slice(0, maxDocumentsAllowed)
      );
    } catch (error) {
      console.error("Error during document upload:", error);
      Alert.alert("Upload Error", "There was an error uploading the document.");
    } finally {
      setIsUploading(false); // Ensuring to stop the loading indicator also at the end  of the process
    }
  };

  const deleteDocument = (index) => {
    setDocumentUrls(documentUrls.filter((_, i) => i !== index));
  };

  const navigateToTaskDetail = (item) => {
    navigation.navigate("TaskDetailScreen", {
      task: item,
      onTaskUpdate: fetchTasks,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : null}
      enabled
    >
      <SafeAreaView style={styles.container}>
        {/* Task Name Input */}
        <View style={styles.inputContainer}>
          <Icon name="title" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Task Name"
            value={taskName}
            onChangeText={setTaskName}
            onSubmitEditing={() => {}}
            returnKeyType="done"
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
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Enter") {
                setDescription(description + "\n");
              }
            }}
            blurOnSubmit={true} // this will close the keyboard when the user presses enter
          />
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

        {/* Location Input with GooglePlacesAutocomplete */}
        <GooglePlacesAutocomplete
          placeholder="Search for places"
          fetchDetails={true}
          onPress={(data, details = null) => {
            // Logic to handle the selection of a place
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
            container: {
              position: "absolute",
              top:
                keyboardVisible && isLocationInputFocused
                  ? isTablet
                    ? "20%"
                    : "10%"
                  : isTablet
                  ? "35%"
                  : "45%",
              width: "100%",
            },
            textInputContainer: {
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 20,
              padding: 5,
              paddingLeft: 10,
            },
            textInput: {
              height: 38,
              color: "#5d5d5d",
              fontSize: 16,
            },
            listView: {
              backgroundColor: "white",
              zIndex: 1000,
            },
          }}
          onFocus={() => setIsLocationInputFocused(true)}
          onBlur={() => setIsLocationInputFocused(false)}
        />

        {/* Map Button */}
        <TouchableOpacity
          style={styles.mapIconButton}
          onPress={() => setIsMapVisible(true)}
        >
          <Icon name="map" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <Modal
            animationType="slide"
            transparent={false}
            visible={isMapVisible}
            onRequestClose={() => setIsMapVisible(false)}
          >
            <View style={styles.mapModalContainer}>
              <MapView
                style={{ width: "100%", height: "80%" }}
                region={region}
                onRegionChangeComplete={setRegion}
              >
                <Marker coordinate={region} />
              </MapView>
              <TouchableOpacity
                style={styles.hideMapButton}
                onPress={() => setIsMapVisible(false)}
              >
                <Text style={{ color: "#FFFFFF" }}>Hide Map</Text>
              </TouchableOpacity>
            </View>
          </Modal>
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
          <TouchableOpacity
            onPress={handleDocumentUpload}
            style={styles.documentButton}
          >
            <Icon name="attach-file" style={styles.documentIcon} />
          </TouchableOpacity>
        </View>

        {/* Save and Cancel Buttons */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Icon name="check" style={styles.saveIcon} />
        </TouchableOpacity>
      </SafeAreaView>
      {isUploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAE5",
    paddingTop: isTablet ? 15 : 5,
    paddingHorizontal: isTablet ? 20 : 10,
  },
  headerText: {
    marginTop: 6,
    fontSize: isTablet ? 32 : 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  centeredView: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  iconButton: {
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#FFF",
    borderRadius: 30,
    paddingVertical: isTablet ? 15 : 12,
    paddingHorizontal: isTablet ? 20 : 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: isTablet ? 20 : 19,
    color: "#333",
    marginLeft: 10,
  },
  multilineInput: {
    marginBottom: 30,
    textAlignVertical: "top",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  selectedDocumentContainer: {
    marginTop: isTablet ? 100 : 170,
    alignItems: "center",
    marginBottom: 20,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#9BBEC8",
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  deleteText: {
    color: "red",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 25,
  },
  saveButton: {
    backgroundColor: "#D2DE32",
    borderRadius: 40,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveIcon: {
    color: "white",
    fontSize: 30,
  },
  documentButton: {
    marginTop: isTablet ? 25 : 20,
    marginBottom: 10,
    backgroundColor: "#0782F9",
    borderRadius: 30,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    alignSelf: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  documentIcon: {
    color: "white",
    fontSize: 30,
  },
  showMapButton: {
    marginTop: 100,
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 30,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  mapModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  hideMapButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f44336",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  mapIconButton: {
    marginTop: isTablet ? 2 : 20,
    position: "absolute",
    right: 20,
    top: Platform.OS === "ios" ? (isTablet ? 450 : 410) : isTablet ? 500 : 410,
    backgroundColor: "#4CAF50",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});

export default TaskDetailsScreen;
