import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import HomeScreen from "./components/HomeScreen";
import CategoryScreen from "./components/CategoryScreen";
import RewardsScreen from "./components/RewardsScreen";
import ProfileScreen from "./components/ProfileScreen";
import TaskScreen from "./components/TaskScreen";
import CreateTask from "./components/CreateTask";
import TaskDetailScreen from "./components/TaskDetailScreen";
import EditCategoryScreen from "./components/EditCategoryScreen";
import CompletedTaskScreen from "./components/CompletedTaskScreen";
import TaskOrCategoryScreen from "./components/TaskOrCategoryScreen";
import SuggestionsScreen from "./components/SuggestionsScreen";
import SearchScreen from "./components/SearchScreen";
import HelpScreen from "./components/HelpScreen";

import { StatusBar } from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import { registerForPushNotificationsAsync } from "./components/notifications";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "Dashboard":
              iconName = focused ? "ios-home" : "ios-home-outline";
              break;
            case "Category":
              iconName = focused ? "ios-list" : "ios-list-outline";
              break;
            case "Rewards":
              iconName = focused ? "ios-trophy" : "ios-trophy-outline";
              break;
            case "Profile":
              iconName = focused ? "ios-person" : "ios-person-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6B240C",
        tabBarInactiveTintColor: "grey",
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#43766C",
          },
          headerTintColor: "#fff",
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          headerShown: true, // Show the header
          headerStyle: {
            backgroundColor: "#43766C", // Set your desired color here
          },
          headerTintColor: "#fff", // Set your desired header tint color here
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#43766C",
          },
          headerTintColor: "#fff",
        }}
      />
    </Tab.Navigator>
  );
}
export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="Home"
          component={MyTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TaskScreen"
          component={TaskScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="CreateTask"
          component={CreateTask}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="CategoryScreen"
          component={CategoryScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="TaskDetailScreen"
          component={TaskDetailScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="EditCategoryScreen"
          component={EditCategoryScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="CompletedTaskScreen"
          component={CompletedTaskScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="TaskOrCategoryScreen"
          component={TaskOrCategoryScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="SuggestionsScreen"
          component={SuggestionsScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="SearchScreen"
          component={SearchScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="HelpScreen"
          component={HelpScreen}
          options={{
            headerStyle: {
              backgroundColor: "#43766C",
            },
            headerTintColor: "#fff",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
