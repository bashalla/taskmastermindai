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
} from "react-native";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialIcons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_API_KEY } from "@env";

const TaskDetailsScreen = ({ navigation, route }) => {
  const { task } = route.params;
  const [taskName, setTaskName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [deadline, setDeadline] = useState(new Date(task.deadline));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(task.documentUrl);
  const [region, setRegion] = useState({
    latitude: task.location.latitude,
    longitude: task.location.longitude,
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

  const handleSave = async () => {
    try {
      if (!taskName || !description) {
        Alert.alert("Error", "Please fill in all the required fields.");
        return;
      }

      const updatedTask = {
        name: taskName,
        description,
        deadline: deadline.toISOString(),
        documentUrl,
        location: region,
      };

      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, updatedTask);

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

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(Platform.OS === "ios");
    setDeadline(currentDate);
  };

  const openDocument = () => {
    if (documentUrl) {
      Linking.openURL(documentUrl);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <Icon name="title" size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Task Name"
          value={taskName}
          onChangeText={setTaskName}
        />
      </View>

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
            onChange={onChangeDate}
          />
        )}
      </View>

      <View style={styles.selectedDocumentContainer}>
        <TouchableOpacity onPress={openDocument}>
          <Text>View Document: {documentUrl ? "Available" : "None"}</Text>
        </TouchableOpacity>
      </View>

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
});

export default TaskDetailsScreen;
