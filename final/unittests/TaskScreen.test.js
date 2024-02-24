import React from "react";
import { render } from "@testing-library/react-native";
import TaskScreen from "../components/TaskScreen";

// Mocking MaterialIcons and AsyncStorage
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mocking React Navigation and providing the necessary route params
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: { categoryId: "1", categoryName: "Work" },
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mocking expo-calendar and Firestore
jest.mock("expo-calendar", () => ({
  requestCalendarPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  requestRemindersPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  createEventAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
}));

// Mocking Firebase Firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mocking Firebase Auth
describe("TaskScreen", () => {
  const route = {
    params: {
      categoryId: "1",
      categoryName: "Work",
    },
  };

  // Test Suite
  it("renders the screen title", () => {
    const { getByText } = render(<TaskScreen route={route} />);
    expect(getByText(/Open Tasks for Work/i)).toBeTruthy();
  });

  // Add Task button test
  it("renders the add task button", () => {
    const { getByTestId } = render(<TaskScreen route={route} />);
    const addButton = getByTestId("addTaskButton");
    expect(addButton).toBeTruthy();
  });
});
