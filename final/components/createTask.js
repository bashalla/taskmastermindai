import React, { useState, useEffect } from "react";
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
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
import { db, auth } from "../firebase";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "@env";

// This component will be used to create a new task
const CreateTask = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(""); // Added state for selected file name
  const [tempDate, setTempDate] = useState(new Date());

  // Function to upload documents to Firebase Storage
  const uploadDocumentsToFirebase = async (documents) => {
    const urls = [];

    // Upload each document to Firebase Storage
    for (const document of documents) {
      const storage = getStorage();
      const storageRef = ref(storage, `taskDocuments/${document.name}`);
      const response = await fetch(document.uri);
      const blob = await response.blob();

      const uploadTask = uploadBytesResumable(storageRef, blob);

      const url = await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            /* ... */
          },
          (error) => {
            reject(error);
          },
          () => {
            // Upload completed successfully, now we can get the download URL
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });

      urls.push({ name: document.name, url });
    }

    return urls;
  };

  // Fetch location when the screen loads
  useEffect(() => {
    // Function to get the end of the current day
    const getEndOfToday = () => {
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
    };

    // Setting the deadline to the end of the current day
    setDeadline(getEndOfToday());

    // Function to request and fetch location
    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access location was denied");
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        console.error("Error fetching location:", error);
        Alert.alert("Error", "Unable to fetch current location.");
      }
    };

    fetchLocation();
  }, []);

  const handleSaveTask = async () => {
    // Validating input fields
    if (!taskName || !description) {
      Alert.alert("Error", "Please fill in all the required fields.");
      return;
    }

    // Preparing task data with timestamp and location
    const taskData = {
      name: taskName,
      description,
      deadline: deadline.toISOString(),
      location: region
        ? { latitude: region.latitude, longitude: region.longitude }
        : null,
      createdAt: serverTimestamp(),
      categoryId,
      userId: auth.currentUser.uid,
    };

    try {
      // Upload documents to Firebase Storage and get their URLs (if documents are selected)
      if (documents.length > 0) {
        const uploadedDocuments = await uploadDocumentsToFirebase(documents);
        taskData.documentUrls = uploadedDocuments.map((doc) => ({
          name: doc.name,
          url: doc.url,
        }));
      }

      // Save the task to Firestore
      const docRef = await addDoc(collection(db, "tasks"), taskData);
      console.log("Task created with ID: ", docRef.id);
      Alert.alert("Task Created", "Your task has been created successfully.");

      // Navigation or additional logic after successful task creation
      // Check if navigated from TaskOrCategoryScreen
      if (route.params?.from === "TaskOrCategoryScreen") {
        navigation.navigate("Home", { screen: "Dashboard" }); // Navigate to HomeScreen
      } else {
        navigation.goBack(); // Go back to the previous screen
      }
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "There was an error saving the task.");
    }
  };

  // Function to select documents
  const selectDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      if (result.cancelled) {
        console.log("Document selection was cancelled");
      } else {
        setDocuments((currentDocuments) => [
          ...currentDocuments,
          ...(result.assets || []),
        ]);
      }
    } catch (err) {
      console.error("Error picking documents:", err);
    }
  };

  // Function to handle date change
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(Platform.OS === "ios");
    if (
      event.type === "set" ||
      (event.type === "dismissed" && Platform.OS === "android")
    ) {
      setDeadline(adjustDeadline(currentDate));
    }
  };
  // Calling this function when the user confirms the date selection
  const confirmDateSelection = () => {
    const endOfDay = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      tempDate.getDate(),
      23,
      59,
      59,
      999
    );
    setDeadline(endOfDay); // Updating here the actual deadline
    setShowDatePicker(false); // Closing the date picker
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const deleteDocument = (index) => {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((_, i) => i !== index)
    );
  };

  // Function to adjust the deadline to the end of the day
  const adjustDeadline = (date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59
    );
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
          onSubmitEditing={() => {
            /* Handle the submit action, e.g., close keyboard */
          }}
          returnKeyType="done" // for iOS to show "Done" instead of "return"
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
          onSubmitEditing={() => {
            /* Handle the submit action, e.g., close keyboard */
          }}
          blurOnSubmit={true} // this will close the keyboard when the user presses enter
        />
      </View>

      {/* Location Search */}
      <GooglePlacesAutocomplete
        placeholder="Search for places"
        fetchDetails={true}
        onPress={(data, details = null) => {
          // 'details provided when fetchDetails is true
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
          textInput: {
            height: 38,
            color: "#5d5d5d",
            fontSize: 16,
          },
          predefinedPlacesDescription: {
            color: "#1faadb",
          },
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

      {/* Document Picker */}
      <TouchableOpacity style={styles.button} onPress={selectDocument}>
        <Icon name="attach-file" size={20} color="white" />
        <Text style={styles.buttonText}>Select Document</Text>
      </TouchableOpacity>
      <View style={styles.selectedDocumentContainer}>
        {documents.map((doc, index) => (
          <View key={index} style={styles.documentRow}>
            <Text>{doc.name}</Text>
            <TouchableOpacity onPress={() => deleteDocument(index)}>
              <Text style={styles.deleteText}>x</Text>
            </TouchableOpacity>
          </View>
        ))}
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
              setShowDatePicker(Platform.OS === "ios");
              if (
                event.type === "set" ||
                (event.type === "dismissed" && Platform.OS === "android")
              ) {
                setDeadline(adjustDeadline(selectedDate || deadline));
              }
            }}
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
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
    padding: 5,
  },
  deleteIcon: {
    marginLeft: 10,
  },
  deleteText: {
    color: "red",
    fontWeight: "bold",
    fontSize: 20,
    paddingHorizontal: 10,
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
    height: 300,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  textInputContainer: {
    backgroundColor: "grey",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});

export default CreateTask;
