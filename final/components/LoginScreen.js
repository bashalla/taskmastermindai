import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  getAuth,
  signInWithCredential,
  GithubAuthProvider,
} from "firebase/auth";
import { useNavigation } from "@react-navigation/core";
import * as AuthSession from "expo-auth-session";
import * as Random from "expo-random";
import { auth } from "../firebase";

const githubConfig = {
  clientId: "Iv1.5f86f75a4b7af4da",
  clientSecret: "8b6c093410253b51bc4d79d55a91e39094143a1e",
  redirectUrl: AuthSession.makeRedirectUri({
    useProxy: true, // Use proxy for better handling in development
  }),
  scopes: ["identity"],
};

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

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Logged in with:", user.email);
      })
      .catch((error) => {
        Alert.alert("Login Error", error.message);
      });
  };

  const handlePasswordReset = () => {
    if (email) {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          Alert.alert(
            "Check your email",
            "Password reset link has been sent to your email."
          );
        })
        .catch((error) => {
          Alert.alert("Error", error.message);
        });
    } else {
      Alert.alert("Input Required", "Please enter your email address.");
    }
  };

  const handleGitHubLogin = async () => {
    try {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${
        githubConfig.clientId
      }&redirect_uri=${encodeURIComponent(
        githubConfig.redirectUrl
      )}&scope=${githubConfig.scopes.join(" ")}`;
      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === "success" && result.params.code) {
        const code = result.params.code;
        const response = await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: githubConfig.clientId,
              client_secret: githubConfig.clientSecret,
              code: code,
            }),
          }
        );
        const data = await response.json();
        const credential = GithubAuthProvider.credential(data.access_token);
        await signInWithCredential(auth, credential);

        console.log("GitHub sign in successful");
        navigation.navigate("Home");
      }
    } catch (error) {
      console.error("GitHub authentication failed", error);
      Alert.alert("Authentication failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
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
        <TouchableOpacity onPress={handleGitHubLogin} style={styles.button}>
          <Text style={styles.buttonText}>Login with GitHub</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 5,
  },
  buttonContainer: {
    width: "60%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  button: {
    backgroundColor: "#0782F9",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonOutline: {
    backgroundColor: "white",
    marginTop: 5,
    borderColor: "#0782F9",
    borderWidth: 2,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonOutlineText: {
    color: "#0782F9",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default LoginScreen;
