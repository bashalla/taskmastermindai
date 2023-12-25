import React, { useState } from "react";
import { View, TextInput, Button } from "react-native";
import { auth } from "../configuration/firebase";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      console.log("User signed up successfully");
    } catch (error) {
      console.error("Error signing up:", error);
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
      <Button title="Signup" onPress={handleSignup} />
    </View>
  );
};

export default Signup;
