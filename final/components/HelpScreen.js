import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
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
          Each task completed on time earns you 10 points. Points are awarded
          provided the task's deadline has not been changed more than 3 times
          and the task is not overdue. If the task is overdue or the deadline
          changed too often, no points will be awarded.
        </Text>
      </View>

      <View style={styles.section}>
        <Icon name="contact-support" size={30} color="#0782F9" />
        <Text style={styles.sectionTitle}>Support</Text>
        <Text style={styles.sectionContent}>
          If you encounter any issues or have queries, please contact the
          developer team via{" "}
          <Text
            style={styles.emailLink}
            onPress={() =>
              Linking.openURL("mailto:sebastian.hallabrin@googlemail.com")
            }
          >
            Mail
          </Text>
          .
        </Text>
      </View>

      <View style={styles.section}>
        <Icon name="today" size={30} color="#0782F9" />
        <Text style={styles.sectionTitle}>5 Days Challenge</Text>
        <Text style={styles.sectionContent}>
          In the 5 Days Challenge, you can earn an extra 100 points by
          successfully closing a task for five consecutive days, making your
          task management experience even more rewarding!
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
  emailLink: {
    color: "#0782F9",
    textDecorationLine: "underline",
  },
  // ... additional styles
});

export default HelpScreen;
