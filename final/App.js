import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import SumTest from "./components/Sum";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>I Love my Habi</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
