import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const HelpScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Help & Information</Text>
      </View>

      <View style={styles.section}>
        <Icon name="emoji-events" size={30} color="#0782F9" />
        <Text style={styles.sectionTitle}>Gamification</Text>
        <Text style={styles.sectionContent}>
          Discover how gamification makes task management fun and rewarding.
          Accumulate points by completing tasks and achieving goals.
        </Text>
      </View>

      <View style={styles.section}>
        <Icon name="stars" size={30} color="#0782F9" />
        <Text style={styles.sectionTitle}>Point System</Text>
        <Text style={styles.sectionContent}>
          Each task completed on time earns you points. The more challenging the
          task, the more points you earn!
        </Text>
      </View>

      {/* Add more sections as needed */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 65,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 16,
  },
  // ... additional styles
});

export default HelpScreen;
