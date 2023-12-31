import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import placeholderImage from "../assets/adaptive-icon.png";
import * as ImageManipulator from "expo-image-manipulator";
import CountryPicker from "react-native-country-picker-modal";
import { Picker } from "@react-native-picker/picker";

const resizeImage = async (imageUri) => {
  try {
    // Resize the image to a square while maintaining quality
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800, height: 800 } }], // Square dimensions
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error("Error resizing image:", error);
  }
};

function ProfileScreen() {
  const [userData, setUserData] = useState({
    firstName: "",
    name: "",
    nationality: "",
    gender: "",
    age: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [agePickerVisible, setAgePickerVisible] = useState(false);

  const handleCountrySelect = (country) => {
    setUserData({ ...userData, nationality: country.name });
    setCountryPickerVisible(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
        setProfileImage(docSnap.data().profileImageUrl);
      } else {
        console.log("No such document!");
      }
    };

    fetchData();
  }, []);

  const handleSelectImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Launch image library to select an image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    // Exit if selection is canceled
    if (result.canceled) {
      return;
    }

    // Proceed if an image is selected
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const imageUri = asset.uri;

      // Resize the image using expo-image-manipulator
      try {
        const resizedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800, height: 800 } }], // Square dimensions
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const resizedImageUri = resizedImage.uri;

        // Prepare the image for upload
        const response = await fetch(resizedImageUri);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `profileImages/${auth.currentUser.uid}`
        );

        // Upload the image
        try {
          const snapshot = await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(snapshot.ref);
          setProfileImage(downloadURL);
          updateProfileImage(downloadURL);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
        }
      } catch (resizeError) {
        console.error("Error resizing image:", resizeError);
      }
    }
  };

  const updateProfileImage = async (url) => {
    const userDoc = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userDoc, {
      profileImageUrl: url,
    });
  };

  const handleUpdateProfile = async () => {
    const userDoc = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userDoc, userData);
    Alert.alert(
      "Profile Updated",
      "Your profile has been updated successfully."
    );
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Password Error", "Password should be at least 6 characters");
      return;
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert("Password Updated", "Password updated successfully");
    } catch (error) {
      Alert.alert("Password Update Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <TouchableOpacity onPress={handleSelectImage}>
          <Image
            source={profileImage ? { uri: profileImage } : placeholderImage}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={userData.firstName}
          onChangeText={(text) => setUserData({ ...userData, firstName: text })}
          placeholder="First Name"
        />
        <TextInput
          style={styles.input}
          value={userData.name}
          onChangeText={(text) => setUserData({ ...userData, name: text })}
          placeholder="Last Name"
        />

        {/* Nationality Picker */}
        <TouchableOpacity
          onPress={() => setCountryPickerVisible(true)}
          style={styles.input}
        >
          <Text style={styles.inputText}>
            {userData.nationality || "Select Nationality"}
          </Text>
        </TouchableOpacity>
        <CountryPicker
          visible={countryPickerVisible}
          onSelect={handleCountrySelect}
          onClose={() => setCountryPickerVisible(false)}
          containerButtonStyle={{ display: "none" }}
        />

        {/* Age Picker */}
        <TouchableOpacity
          onPress={() => setAgePickerVisible(true)}
          style={styles.input}
        >
          <Text style={styles.inputText}>
            {userData.age ? `Age: ${userData.age}` : "Select Age"}
          </Text>
        </TouchableOpacity>
        <Modal
          transparent={true}
          visible={agePickerVisible}
          onRequestClose={() => setAgePickerVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Picker
                selectedValue={userData.age}
                onValueChange={(itemValue) =>
                  setUserData({ ...userData, age: itemValue })
                }
                style={styles.picker}
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map((age) => (
                  <Picker.Item key={age} label={`${age}`} value={age} />
                ))}
              </Picker>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setAgePickerVisible(false)}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Gender Selection */}
        <View style={styles.genderContainer}>
          <TouchableOpacity
            onPress={() => setUserData({ ...userData, gender: "male" })}
            style={[
              styles.genderButton,
              userData.gender === "male" ? styles.genderButtonSelected : {},
            ]}
          >
            <Text style={styles.genderText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUserData({ ...userData, gender: "female" })}
            style={[
              styles.genderButton,
              userData.gender === "female" ? styles.genderButtonSelected : {},
            ]}
          >
            <Text style={styles.genderText}>Female</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUserData({ ...userData, gender: "other" })}
            style={[
              styles.genderButton,
              userData.gender === "other" ? styles.genderButtonSelected : {},
            ]}
          >
            <Text style={styles.genderText}>Other</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          secureTextEntry // This keeps the text hidden for password privacy
          placeholderTextColor="gray" // Optionally set placeholder text color
        />
        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 150, // Circle diameter
    height: 150, // Same as width for a perfect circle
    borderRadius: 75, // Half of width/height
    marginBottom: 20,
  },
  input: {
    backgroundColor: "white", // Ensures a white background
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    marginVertical: 10,
    fontSize: 14, // Makes text larger and more visible
    width: "100%", // Adjust width as per your layout
    borderWidth: 1,
    borderColor: "gray",
    color: "black", // Ensures text color is black for visibility
  },
  button: {
    marginBottom: 20,
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center", // Center the modal vertically
    alignItems: "center", // Center the modal horizontally
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%", // Adjust the width as needed
    alignItems: "center", // Center the contents
  },
  picker: {
    width: "100%",
    height: 150,
  },
  modalButton: {
    backgroundColor: "#0782F9",
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    width: "50%", // Adjust the width as needed
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  genderButton: {
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "#0782F9",
  },
  genderText: {
    fontSize: 18,
  },
  genderButtonSelected: {
    backgroundColor: "#0782F9",
    color: "white",
  },
});

export default ProfileScreen;
