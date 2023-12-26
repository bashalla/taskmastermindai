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
import { useNavigation } from "@react-navigation/native"; // Change import
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const navigation = useNavigation(); // Get navigation object

  const handleSignUp = () => {
    if (
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !name ||
      !nationality ||
      !gender ||
      !age
    ) {
      Alert.alert("Incomplete Form", "Please fill in all the fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Registered with:", user.email);

        const userRef = doc(db, "users", user.uid);
        setDoc(userRef, {
          name: name,
          firstName: firstName,
          nationality: nationality,
          gender: gender,
          age: age,
        })
          .then(() => {
            navigation.navigate("Home");
          })
          .catch((error) => {
            Alert.alert("Registration Error", error.message);
          });
      })
      .catch((error) => Alert.alert("Registration Error", error.message));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
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
          placeholder="Confirm Password"
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
          style={[styles.input, { marginBottom: 10 }]}
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
  backButton: {
    position: "absolute",
    top: 80,
    left: 20,
  },
  backButtonText: {
    color: "#0782F9",
    fontSize: 16,
  },
  inputContainer: {
    width: "80%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
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
    marginTop: 10,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0782F9",
    marginLeft: 5,
  },
});

export default RegisterScreen;
