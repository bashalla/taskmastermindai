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
  ActionSheetIOS,
} from "react-native";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { updatePassword, deleteUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import placeholderImage from "../assets/adaptive-icon.png";
import * as ImageManipulator from "expo-image-manipulator";
import CountryPicker from "react-native-country-picker-modal";
import { Picker } from "@react-native-picker/picker";
import { Camera } from "expo-camera";

// This component will be used to edit the users profiles
const resizeImage = async (imageUri) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800, height: 800 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error("Error resizing image:", error);
  }
};

function ProfileScreen({ navigation }) {
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

  const handleCountrySelect = (country) => {
    setUserData({ ...userData, nationality: country.name });
    setCountryPickerVisible(false);
  };

  const handleCaptureImage = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const imageUri = result.assets[0].uri; // Use assets array
    const resizedImage = await resizeImage(imageUri);

    try {
      const response = await fetch(resizedImage);
      const blob = await response.blob();
      const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);

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
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const imageUri = asset.uri;

      try {
        const resizedImage = await resizeImage(imageUri);
        const response = await fetch(resizedImage);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `profileImages/${auth.currentUser.uid}`
        );

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

  const selectImageSource = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Take Photo", "Choose from Library"],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          handleCaptureImage();
        } else if (buttonIndex === 2) {
          handleSelectImage();
        }
      }
    );
  };

  //
  const handleUpdateProfile = async () => {
    const userDoc = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userDoc, userData);
    Alert.alert(
      "Profile Updated",
      "Your profile has been updated successfully."
    );
  };

  // Change the users password
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

  // Function to delete the user
  const handleDeleteUser = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete user data from Firestore
              const userDoc = doc(db, "users", auth.currentUser.uid);
              await deleteDoc(userDoc);

              // Delete user authentication record
              await deleteUser(auth.currentUser);

              // Navigate to the login screen
              navigation.navigate("Login");
            } catch (error) {
              console.error("Error deleting user:", error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <TouchableOpacity onPress={selectImageSource}>
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
          placeholderTextColor="gray"
        />
        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.button} onPress={handleDeleteUser}>
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
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
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    marginVertical: 10,
    fontSize: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "gray",
    color: "black",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background here
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
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
    width: "50%",
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
