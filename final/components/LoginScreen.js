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
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { useNavigation } from "@react-navigation/core";
import { auth } from "../firebase";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as Font from "expo-font";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { IOS_APP_ID } from "@env";
import { ANDROID_APP_ID } from "@env";

WebBrowser.maybeCompleteAuthSession();

const screenWidth = Dimensions.get("window").width;
const isTablet = screenWidth > 768;

// Login screen component
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState("");
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "1092527297385-ch2kpcu2hife6685id5dj38mdod6qtdv.apps.googleusercontent.com",
    androidClientId: "ANDROID_APP_ID",
  });

  //Handling Sign in with Google
  useEffect(() => {
    if (response?.type == "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          MaterialCommunityIcons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"),
        });
      } catch (error) {
        console.error("Error loading fonts", error);
      }
    };

    loadFonts();
    // Set up the authentication state change listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigation.replace("Home");
      }
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
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

  // Placeholder for Google Sign-In functionality
  const handleGoogleSignIn = () => {
    Alert.alert("Google Sign-In", "Functionality to be implemented.");
  };

  // Return the screen content
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior="padding">
        <View style={styles.logoContainer}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.welcomeText}>TaskMastermind Ai</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={(text) => setEmail(text.toLowerCase())}
            style={styles.input}
            textContentType="oneTimeCode"
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
          <TouchableOpacity
            onPress={() => promptAsync()}
            style={styles.googleButton}
          >
            <MaterialCommunityIcons
              name="google"
              size={isTablet ? wp("4%") : wp("5%")}
              color="white"
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAE5",
  },
  keyboardAvoiding: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: isTablet ? hp("5%") : hp("3"),
  },
  logo: {
    width: isTablet ? wp("20%") : wp("30%"),
    height: isTablet ? wp("20%") : wp("30%"),
    borderRadius: isTablet ? wp("10%") : wp("15%"),
    resizeMode: "contain",
  },
  welcomeText: {
    fontSize: isTablet ? wp("6%") : wp("7%"),
    fontWeight: "bold",
    marginVertical: hp("2%"),
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "Roboto",
  },
  inputContainer: {
    width: isTablet ? wp("70%") : wp("80%"),
    alignSelf: "center",
    marginTop: hp("2%"),
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("2%"),
    borderRadius: 10,
    marginTop: hp("1%"),
    fontSize: isTablet ? wp("3.5%") : wp("4%"),
  },
  buttonContainer: {
    width: isTablet ? wp("50%") : wp("60%"),
    alignSelf: "center",
    marginTop: hp("4%"),
  },
  button: {
    backgroundColor: "#265073",
    width: "100%",
    padding: isTablet ? hp("2%") : hp("2.5%"),
    borderRadius: 10,
    alignItems: "center",
    marginBottom: hp("1%"),
  },
  buttonOutline: {
    backgroundColor: "white",
    borderColor: "#0782F9",
    borderWidth: 2,
    marginTop: hp("1%"),
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: isTablet ? wp("3.5%") : wp("4%"),
  },
  buttonOutlineText: {
    color: "#0782F9",
    fontWeight: "700",
    fontSize: isTablet ? wp("3.5%") : wp("4%"),
  },
  googleButton: {
    backgroundColor: "#db4437",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: isTablet ? hp("1.5%") : hp("2%"),
    borderRadius: 10,
    marginTop: hp("2%"),
  },
  googleButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: isTablet ? wp("3.5%") : wp("4%"),
    marginLeft: 10,
  },
  googleIcon: {
    marginRight: isTablet ? wp("2%") : wp("3%"),
  },
});

export default LoginScreen;
