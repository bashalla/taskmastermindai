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

import { registerForPushNotificationsAsync } from "./components/notifications";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Category" component={CategoryScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={MyTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TaskScreen"
          component={TaskScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateTask"
          component={CreateTask}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CategoryScreen"
          component={CategoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TaskDetailScreen"
          component={TaskDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditCategoryScreen"
          component={EditCategoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompletedTaskScreen"
          component={CompletedTaskScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TaskOrCategoryScreen"
          component={TaskOrCategoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SuggestionsScreen"
          component={SuggestionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SearchScreen"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HelpScreen"
          component={HelpScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
