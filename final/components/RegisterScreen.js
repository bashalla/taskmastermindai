import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import CountryPicker from "react-native-country-picker-modal";
import { Picker } from "@react-native-picker/picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
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
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [agePickerVisible, setAgePickerVisible] = useState(false);
  const genderPlaceholder = gender || "Select Gender";

  const navigation = useNavigation();

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
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
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
          />
          <TextInput
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
          />
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() => setCountryPickerVisible(true)}
            style={styles.input}
          >
            <Text style={styles.inputText}>
              {nationality || "Select Nationality"}
            </Text>
          </TouchableOpacity>
          <CountryPicker
            visible={countryPickerVisible}
            onSelect={(country) => {
              setNationality(country.name);
              setCountryPickerVisible(false);
            }}
            onClose={() => setCountryPickerVisible(false)}
            containerButtonStyle={{ display: "none" }}
          />

          <View style={styles.genderContainer}>
            <TouchableOpacity
              onPress={() => setGender("male")}
              style={[
                styles.genderButton,
                gender === "male" ? styles.genderButtonSelected : {},
              ]}
            >
              <Text style={styles.genderText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGender("female")}
              style={[
                styles.genderButton,
                gender === "female" ? styles.genderButtonSelected : {},
              ]}
            >
              <Text style={styles.genderText}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGender("other")}
              style={[
                styles.genderButton,
                gender === "other" ? styles.genderButtonSelected : {},
              ]}
            >
              <Text style={styles.genderText}>Other</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setAgePickerVisible(true)}
            style={styles.input}
          >
            <Text style={styles.inputText}>
              {age ? `Age: ${age}` : "Select Age"}
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
                  selectedValue={age}
                  onValueChange={(itemValue) => setAge(itemValue)}
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

          <TouchableOpacity onPress={handleSignUp} style={styles.button}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginVertical: 20,
  },
  backButtonText: {
    color: "#0782F9",
    fontSize: 16,
  },
  inputContainer: {
    width: "90%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    fontSize: 18,
    width: "100%",
  },
  button: {
    backgroundColor: "#0782F9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
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
  },
  genderText: {
    fontSize: 18,
  },
  genderButtonSelected: {
    backgroundColor: "#0782F9",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
  },
  picker: {
    width: "100%",
    height: 150,
  },
  modalButton: {
    backgroundColor: "#0782F9",
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
  },
  // Additional styles for other UI components
});

export default RegisterScreen;
