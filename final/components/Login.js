import React, { useState } from "react";
import { View, TextInput, Button } from "react-native";
import { auth } from "../configuration/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      console.log("User logged in successfully");
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" onChangeText={(text) => setEmail(text)} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={(text) => setPassword(text)}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default Login;
