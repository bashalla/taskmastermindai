import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

// HelpScreen component
const HelpScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Help & Information</Text>
      </View>

      <View style={styles.section}>
        <Icon name="stars" size={hp("3%")} color="#0782F9" />
        <Text style={styles.sectionTitle}>Point System & Gamification</Text>
        <Text style={styles.sectionContent}>
          Each task completed on time earns you 10 points. Points are awarded
          provided the task's deadline has not been changed more than 3 times
          and the task is not overdue. If the task is overdue or the deadline
          changed too often, no points will be awarded.
        </Text>
      </View>

      <View style={styles.section}>
        <Icon name="today" size={hp("3%")} color="#0782F9" />
        <Text style={styles.sectionTitle}>Monthly Challenge</Text>
        <Text style={styles.sectionContent}>
          Try the Monthly Challenge, as you can earn an extra 100 points by
          successfully closing 10 tasks each month, making your task management
          experience even more rewarding! Keep track of your progress in the
          Rewards Section.
        </Text>
      </View>

      {/* Additional Section */}
      <View style={styles.section}>
        <Icon name="lightbulb" size={hp("3%")} color="#0782F9" />
        <Text style={styles.sectionTitle}>AI Scanner</Text>
        <Text style={styles.sectionContent}>
          To identify important tasks, simply click on the lamp icon on the home
          screen. The AI scanner will analyze your tasks and highlight the
          important ones, helping you prioritize your work effectively.
        </Text>
      </View>

      <View style={styles.section}>
        <Icon name="contact-support" size={hp("3%")} color="#0782F9" />
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp("3%"),
    backgroundColor: "#F8FAE5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("2%"),
  },
  headerText: {
    fontSize: hp("2.5%"),
    fontWeight: "bold",
    marginLeft: wp("1%"),
    marginTop: hp("2%"),
  },
  section: {
    marginBottom: hp("2%"),
    marginTop: hp("2%"),
  },
  sectionTitle: {
    fontSize: hp("2%"),
    fontWeight: "bold",
    marginTop: hp("0.5%"),
    marginBottom: hp("0.25%"),
  },
  sectionContent: {
    fontSize: hp("1.75%"),
  },
  emailLink: {
    color: "#0782F9",
    textDecorationLine: "underline",
  },
});

export default HelpScreen;
