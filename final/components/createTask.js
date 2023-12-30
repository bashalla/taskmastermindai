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
import { db } from "../firebase";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "@env";

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

  const uploadDocumentsToFirebase = async (documents) => {
    const urls = [];

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

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const handleSaveTask = async () => {
    // Validate input fields
    if (!taskName || !description) {
      Alert.alert("Error", "Please fill in all the required fields.");
      return;
    }

    // Prepare task data with timestamp and location
    const taskData = {
      name: taskName,
      description,
      deadline: deadline.toISOString(),
      location: region
        ? { latitude: region.latitude, longitude: region.longitude }
        : null,
      createdAt: serverTimestamp(), // Adds a timestamp
      categoryId,
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

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(Platform.OS === "ios");
    setDeadline(currentDate);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const deleteDocument = (index) => {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((_, i) => i !== index)
    );
  };

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

      {/* Location Search */}
      <GooglePlacesAutocomplete
        placeholder="Search for places"
        fetchDetails={true}
        onPress={(data, details = null) => {
          // 'details' is provided when fetchDetails is true
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
              if (selectedDate) {
                setDeadline(adjustDeadline(selectedDate));
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

export default CreateTask;
