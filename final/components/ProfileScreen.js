import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import placeholderImage from "../assets/adaptive-icon.png";
import ImageResizer from "react-native-image-resizer";
// Adjust the path to your placeholder image

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

    // Exit if selection is cancelled
    if (result.canceled) {
      return;
    }

    // Proceed if an image is selected
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const imageUri = asset.uri;

      // Resize the image using react-native-image-resizer
      try {
        const resizedImage = await ImageResizer.createResizedImage(
          imageUri,
          800,
          600,
          "JPEG",
          80
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
    <View style={styles.container}>
      <TouchableOpacity onPress={handleSelectImage}>
        <Image
          source={profileImage ? { uri: profileImage } : placeholderImage}
          style={styles.profileImage}
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
      <TextInput
        style={styles.input}
        value={userData.nationality}
        onChangeText={(text) => setUserData({ ...userData, nationality: text })}
        placeholder="Nationality"
      />
      <TextInput
        style={styles.input}
        value={userData.gender}
        onChangeText={(text) => setUserData({ ...userData, gender: text })}
        placeholder="Gender"
      />
      <TextInput
        style={styles.input}
        value={userData.age}
        onChangeText={(text) => setUserData({ ...userData, age: text })}
        placeholder="Age"
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password"
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    width: "80%",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
  },
});

export default ProfileScreen;
