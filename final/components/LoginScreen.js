import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigation } from "@react-navigation/core";
import { auth } from "../firebase";
import {
  widthPercentageToDP,
  heightPercentageToDP,
} from "react-native-responsive-screen"; // Import the responsive-screen functions

// Login screen component
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigation.replace("Home");
      }
    });

    return unsubscribe;
  }, []);

  // Login with email and password
  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Logged in with:", user.email);
      })
      .catch((error) => {
        if (
          // Handle auth errors
          error.code === "auth/invalid-credential" ||
          error.code === "auth/missing-password" ||
          error.code === "auth/invalid-email"
        ) {
          Alert.alert(
            "Login Error",
            "Invalid email or password. Please check your credentials and try again."
          );
        } else {
          Alert.alert("Login Error", error.message);
        }
      });
  };

  // Send password reset email
  const handlePasswordReset = () => {
    if (email) {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          Alert.alert(
            "Check your email",
            "Password reset link has been sent to your email, if email exists."
          );
        })
        .catch((error) => {
          Alert.alert("Error", error.message);
        });
    } else {
      Alert.alert("Input Required", "Please enter your email address.");
    }
  };

  // Return the screen content
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior="padding">
        <View style={styles.logoContainer}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
        </View>

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
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleLogin} style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={[styles.button, styles.buttonOutline]}
          >
            <Text style={styles.buttonOutlineText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePasswordReset}
            style={[styles.button, styles.buttonOutline]}
          >
            <Text style={styles.buttonOutlineText}>Reset Password</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: heightPercentageToDP("5%"), // Adjust the percentage as needed
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: heightPercentageToDP("5%"), // Adjust the percentage as needed
  },
  logo: {
    width: widthPercentageToDP("50%"), // Adjust the percentage as needed
    height: widthPercentageToDP("50%"), // Adjust the percentage as needed
    resizeMode: "contain",
  },
  inputContainer: {
    width: widthPercentageToDP("80%"), // Adjust the percentage as needed
    alignSelf: "center",
    marginTop: heightPercentageToDP("2%"), // Adjust the percentage as needed
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: widthPercentageToDP("4%"), // Adjust the percentage as needed
    paddingVertical: heightPercentageToDP("2%"), // Adjust the percentage as needed
    borderRadius: 10,
    marginTop: heightPercentageToDP("1%"), // Adjust the percentage as needed
    fontSize: widthPercentageToDP("4%"), // Adjust the percentage as needed
  },
  buttonContainer: {
    width: widthPercentageToDP("60%"), // Adjust the percentage as needed
    alignSelf: "center",
    marginTop: heightPercentageToDP("4%"), // Adjust the percentage as needed
  },
  button: {
    backgroundColor: "#0782F9",
    width: "100%",
    padding: heightPercentageToDP("2.5%"), // Adjust the percentage as needed
    borderRadius: 10,
    alignItems: "center",
    marginBottom: heightPercentageToDP("1%"), // Adjust the percentage as needed
  },
  buttonOutline: {
    backgroundColor: "white",
    borderColor: "#0782F9",
    borderWidth: 2,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: widthPercentageToDP("4%"), // Adjust the percentage as needed
  },
  buttonOutlineText: {
    color: "#0782F9",
    fontWeight: "700",
    fontSize: widthPercentageToDP("4%"), // Adjust the percentage as needed
  },
});

export default LoginScreen;
