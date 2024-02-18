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
  Modal,
  Keyboard,
  ActivityIndicator,
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
import Icon from "react-native-vector-icons/MaterialIcons";
import { db, auth } from "../firebase";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "@env";

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;

// This component will be used to create a new task
const CreateTask = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLocationInputFocused, setIsLocationInputFocused] = useState(false);
  const [googlePlacesInputFocused, setGooglePlacesInputFocused] =
    useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Function to upload documents to Firebase Storage
  const uploadDocumentsToFirebase = async (documents) => {
    setIsUploading(true); // Start uploading
    const urls = [];

    try {
      for (const document of documents) {
        const storage = getStorage();
        const storageRef = ref(storage, `taskDocuments/${document.name}`);
        const response = await fetch(document.uri);
        const blob = await response.blob();

        const uploadTask = uploadBytesResumable(storageRef, blob);

        const url = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => {
              reject(error);
            },
            () => {
              // Upload completed successfully, now getting the download URL
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL);
              });
            }
          );
        });

        urls.push({ name: document.name, url });
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      Alert.alert(
        "Upload Failed",
        "There was an error uploading your documents."
      );
    } finally {
      setIsUploading(false); // End uploading
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
      // Upload documents to Firebase Storage and get the URLs (if documents are selected)
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

  // Function to toggle the modal
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  // Function to select documents
  const selectDocument = async () => {
    // Determine the maximum number of documents based on the platform
    const maxDocumentsAllowed = Platform.OS === "android" ? 1 : 2;

    // Check if the current number of documents has reached the limit
    if (documents.length >= maxDocumentsAllowed) {
      Alert.alert(
        "Limit Reached",
        `You can only upload up to ${maxDocumentsAllowed} attachment${
          maxDocumentsAllowed > 1 ? "s" : ""
        }.`
      );
      return; // Prevent further execution
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        // For iOS, we allow multiple selection if more than one document is allowed
        multiple: Platform.OS === "ios" && maxDocumentsAllowed > 1,
      });

      if (result.cancelled) {
        console.log("Document selection was cancelled");
        return;
      }

      // Handle single document selection on Android
      const newDocuments =
        Platform.OS === "android" ? [result] : result.assets || [];
      const totalPossibleDocuments = documents.length + newDocuments.length;

      if (totalPossibleDocuments <= maxDocumentsAllowed) {
        setDocuments((currentDocuments) => [
          ...currentDocuments,
          ...newDocuments.map((doc) => ({ name: doc.name, uri: doc.uri })),
        ]);
      } else {
        Alert.alert(
          "Limit Exceeded",
          `You can only upload up to ${maxDocumentsAllowed} attachment${
            maxDocumentsAllowed > 1 ? "s" : ""
          }.`
        );
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
    setDeadline(endOfDay);
    setShowDatePicker(false);
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
            blurOnSubmit={true}
          />
        </View>

        {/* Deadline Picker */}
        <View style={styles.centeredView}>
          <Text style={styles.headerText}>Deadline</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-today" size={50} color="#9A031E" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              display="default"
              minimumDate={new Date()}
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

        {/* Location Search */}
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
              top: keyboardVisible && isLocationInputFocused ? "10%" : "48%",
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

        {/* Document Picker */}

        <TouchableOpacity
          style={styles.documentButton}
          onPress={selectDocument}
        >
          <Icon name="attach-file" style={styles.documentIcon} />
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

        {/* Save  Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
          <Icon name="check" style={styles.saveIcon} />
        </TouchableOpacity>
        {isUploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </SafeAreaView>
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
    borderRadius: 30,
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
    marginTop: 110,
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
    borderRadius: 20,
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
    marginTop: 50,
    position: "absolute",
    right: 20,
    top: Platform.OS === "ios" ? (isTablet ? 500 : 410) : isTablet ? 500 : 410,
    backgroundColor: "#4CAF50",
    width: 50,
    height: 50,
    borderRadius: 25,
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

export default CreateTask;
