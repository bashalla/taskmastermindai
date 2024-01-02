// TaskScreen.test.js
import React from "react";
import { render } from "@testing-library/react-native";
import TaskScreen from "../components/TaskScreen";

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
    useFocusEffect: jest.fn(), // Mock useFocusEffect
  };
});

// Mocking expo-calendar and Firestore if necessary
// Mocking expo-calendar
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
  getFirestore: jest.fn(() => ({
    // Add dummy methods as needed, e.g., collection, doc, etc.
  })),
  collection: jest.fn(() => ({
    // Add dummy methods or values as needed
  })),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  // ... add other Firestore functions you use if needed
}));

describe("TaskScreen", () => {
  const route = {
    params: {
      categoryId: "1",
      categoryName: "Work",
    },
  };

  it("renders the screen title", () => {
    const { getByText } = render(<TaskScreen route={route} />);
    expect(getByText("Tasks for Work")).toBeTruthy();
  });

  it("renders the add task button", () => {
    const { getByText } = render(<TaskScreen route={route} />);
    expect(getByText("+")).toBeTruthy();
  });

  it("renders the back to categories button", () => {
    const { getByText } = render(<TaskScreen route={route} />);
    expect(getByText("Back to Categories")).toBeTruthy();
  });
});
