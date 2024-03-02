import React, { useState, useEffect, useCallback } from "react";
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
  Platform,
  RefreshControl,
  Dimensions,
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

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;

// Resize image function
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
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch data
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

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await fetchData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }

    setRefreshing(false);
  }, []);

  const handleCountrySelect = (country) => {
    setUserData({ ...userData, nationality: country.name });
    setCountryPickerVisible(false);
  };

  // Capture image from camera
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

    // Resize and upload the image
    const imageUri = result.assets[0].uri;
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

  // Select image source
  const selectImageSource = () => {
    if (Platform.OS === "ios") {
      // iOS specific code
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
    } else {
      // Android specific code
      Alert.alert(
        "Select Image",
        "",
        [
          { text: "Take Photo", onPress: () => handleCaptureImage() },
          { text: "Choose from Library", onPress: () => handleSelectImage() },
          { text: "Cancel", onPress: () => {}, style: "cancel" },
        ],
        { cancelable: true }
      );
    }
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
      <ScrollView
        showsVerticalScrollIndicator={false} // This line hides the scroll indicator here
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={selectImageSource}
            style={styles.imageContainer}
          >
            <Image
              source={profileImage ? { uri: profileImage } : placeholderImage}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text
            style={styles.userName}
          >{`${userData.firstName} ${userData.name}`}</Text>
        </View>

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
          secureTextEntry
          placeholderTextColor="gray"
        />
        <TouchableOpacity
          style={styles.changeButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteUser}
        >
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: isTablet ? 30 : 30,
    backgroundColor: "#F8FAE5",
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    marginBottom: isTablet ? 60 : 50,
    paddingHorizontal: 10,
  },
  imageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: isTablet ? 120 : 100,
    height: isTablet ? 120 : 100,
    borderRadius: isTablet ? 60 : 50,
  },
  userName: {
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Regular" : "Roboto",
    fontSize: isTablet ? 40 : 30,
    marginLeft: isTablet ? 30 : 10,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    flexWrap: "wrap",
  },
  input: {
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: isTablet ? 15 : 25,
    padding: isTablet ? 15 : 10,
    fontSize: isTablet ? 15 : 16,
    marginBottom: isTablet ? 15 : 10,
    width: isTablet ? "80%" : "95%",
    alignSelf: "center",
    color: "black",
    backgroundColor: "#F0F0F0",
  },
  inputText: {
    color: "black",
  },
  button: {
    marginBottom: isTablet ? 70 : 20,
    backgroundColor: "#265073",
    padding: isTablet ? 20 : 15,
    borderRadius: isTablet ? 25 : 30,
    alignItems: "center",
    justifyContent: "center",
    width: isTablet ? "50%" : "60%",
    alignSelf: "center",
    marginTop: isTablet ? 25 : 20,
  },
  buttonText: {
    color: "white",
    fontSize: isTablet ? 20 : 18,
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
    backgroundColor: "#FFFFFF",
  },
  genderText: {
    fontSize: isTablet ? 20 : 18,
  },
  genderButtonSelected: {
    backgroundColor: "#AFC8AD",
    color: "white",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: isTablet ? "60%" : "80%",
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
    fontSize: isTablet ? 20 : 18,
  },
  changeButton: {
    backgroundColor: "#E8C872",
    padding: isTablet ? 20 : 15,
    borderRadius: isTablet ? 25 : 30,
    alignItems: "center",
    justifyContent: "center",
    width: isTablet ? "50%" : "60%",
    alignSelf: "center",
    marginTop: isTablet ? 25 : 20,
  },
  deleteButton: {
    backgroundColor: "#F05941",
    padding: isTablet ? 20 : 15,
    borderRadius: isTablet ? 25 : 30,
    alignItems: "center",
    justifyContent: "center",
    width: isTablet ? "50%" : "60%",
    alignSelf: "center",
    marginTop: isTablet ? 25 : 20,
  },
});

export default ProfileScreen;
