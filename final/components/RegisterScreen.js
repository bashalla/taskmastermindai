import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from "@react-navigation/core";
import { auth, db } from "../firebase"; // Adjust this path to the actual location of your Firebase config file
import { doc, setDoc } from "firebase/firestore";

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for password confirmation
  const [firstName, setFirstName] = useState("");
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const navigation = useNavigation();

  const handleSignUp = () => {
    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return; // Prevent registration if passwords don't match
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Registered with:", user.email);

        // Add additional user info to Firestore
        const userRef = doc(db, "users", user.uid);
        setDoc(userRef, {
          name: name,
          firstName: firstName,
          nationality: nationality,
          gender: gender,
          age: age,
        })
          .then(() => {
            // Handle successful registration
            navigation.navigate("Home");
          })
          .catch((error) => {
            // Handle any errors
            Alert.alert("Registration Error", error.message);
          });
      })
      .catch((error) => Alert.alert("Registration Error", error.message));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text.toLowerCase())}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(text) => setPassword(text)}
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          placeholder="Confirm Password" // New input for password confirmation
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(text)}
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          placeholder="First Name"
          value={firstName}
          onChangeText={(text) => setFirstName(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Last Name"
          value={name}
          onChangeText={(text) => setName(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Nationality"
          value={nationality}
          onChangeText={(text) => setNationality(text)}
          style={styles.input}
        />
        <Text>Gender:</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setGender("male")}
          >
            <Text>Male</Text>
            {gender === "male" && <View style={styles.radioDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setGender("female")}
          >
            <Text>Female</Text>
            {gender === "female" && <View style={styles.radioDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setGender("other")}
          >
            <Text>Other</Text>
            {gender === "other" && <View style={styles.radioDot} />}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={(text) => setAge(text)}
          placeholder="Enter your age"
          keyboardType="numeric"
        />
      </View>
      <TouchableOpacity onPress={handleSignUp} style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    width: "80%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10, // Increase the top margin for better spacing
  },
  button: {
    backgroundColor: "#0782F9",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10, // Increase the top margin for better spacing
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0782F9", // Change this to your desired color
    marginLeft: 5,
  },
});

export default RegisterScreen;
