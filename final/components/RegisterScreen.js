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
  Dimensions,
} from "react-native";
import CountryPicker from "react-native-country-picker-modal";
import { Picker } from "@react-native-picker/picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  widthPercentageToDP,
  heightPercentageToDP,
} from "react-native-responsive-screen";

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;
// Register screen component
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

  // Registering with email and password
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

    // Register with email and password
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Registered with:", user.email);

        // Create a new user document in Firestore
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

  // Render the Register screen
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {/* Registration Form Title */}
        <Text style={styles.titleText}>Create Your Account</Text>

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
    flex: 1,
    backgroundColor: "#F8FAE5",
  },
  scrollViewContainer: {
    padding: widthPercentageToDP("8%"),
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: widthPercentageToDP("5%"),
    fontWeight: "bold",
    marginBottom: heightPercentageToDP("2%"),
  },
  labelText: {
    fontSize: widthPercentageToDP("3.5%"),
    fontWeight: "bold",
    color: "#333",
    marginBottom: heightPercentageToDP("1%"),
  },

  inputContainer: {
    width: widthPercentageToDP(isTablet ? "50%" : "82%"),
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: widthPercentageToDP("3.5%"),
    paddingVertical: heightPercentageToDP("1.5%"),
    borderRadius: 10,
    marginVertical: heightPercentageToDP("1%"),
    fontSize: widthPercentageToDP("3.5%"),
    width: "100%",
  },
  button: {
    backgroundColor: "#76453B",
    padding: heightPercentageToDP("2%"),
    borderRadius: 10,
    alignItems: "center",
    marginTop: heightPercentageToDP("1.5%"),
  },
  buttonText: {
    color: "white",
    fontSize: widthPercentageToDP("3.5%"),
    fontWeight: "700",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: heightPercentageToDP("1%"),
  },
  genderButton: {
    padding: widthPercentageToDP("2.5%"),
    borderRadius: 5,
    marginHorizontal: widthPercentageToDP("1%"),
  },
  genderText: {
    fontSize: widthPercentageToDP("3.5%"),
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
    padding: widthPercentageToDP("3.5%"),
    alignItems: "center",
  },
  picker: {
    width: "100%",
    height: heightPercentageToDP(isTablet ? "12%" : "15%"),
  },
  modalButton: {
    backgroundColor: "#0782F9",
    marginTop: heightPercentageToDP("1.5%"),
    padding: widthPercentageToDP("2.5%"),
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: widthPercentageToDP("3.5%"),
  },
  inputText: {
    fontSize: widthPercentageToDP("3%"),
  },
});

export default RegisterScreen;
