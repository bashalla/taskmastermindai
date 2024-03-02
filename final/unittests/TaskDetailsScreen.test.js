import React from "react";
import { render } from "@testing-library/react-native";
import TaskDetailsScreen from "../components/TaskDetailScreen";

// Mocking Firebase Initialization
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ data: () => ({}) })),
  updateDoc: jest.fn(),
}));

// Mocking Expo modules
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

// Mocking React Navigation
jest.mock("react-native-maps", () => ({
  Marker: "Marker",
  MapView: () => "MapView",
}));

jest.mock("react-native-vector-icons/MaterialIcons", () => "Icon");

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mocking Firebase Firestore
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => ({
    forEach: jest.fn((callback) => {
      callback({
        data: () => ({}),
        id: "1",
      });
    }),
  })),
}));
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

// Test Suite
describe("TaskDetailsScreen", () => {
  const route = {
    params: {
      task: {
        id: "1",
        name: "Test Task",
        description: "This is a test description",
        deadline: new Date().toISOString(),
        documentUrls: [],
        location: { latitude: 0, longitude: 0 },
      },
    },
  };
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  // Test Case: TaskDetailsScreen renders correctly
  it("renders without crashing", () => {
    const screen = render(
      <TaskDetailsScreen navigation={navigation} route={route} />
    );
    expect(screen).not.toBeNull();
  });
});
