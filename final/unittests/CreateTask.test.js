import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreateTask from "../components/CreateTask";

// Mock dependencies
jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { categoryId: "1" },
  }),
}));
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => ({
    forEach: jest.fn((callback) => {
      callback({
        data: () => ({
          /* Mock Task Data here */
        }),
        id: "1",
      });
    }),
  })),
}));
// Mocking Firebase Firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({
    // Adding dummy methods to mock Firestore collection
  })),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock component test
describe("CreateTask", () => {
  const route = { params: { categoryId: "1" } };

  it("renders all input fields", () => {
    const { getByPlaceholderText } = render(<CreateTask route={route} />);
    expect(getByPlaceholderText("Task Name")).toBeTruthy();
    expect(getByPlaceholderText("Description")).toBeTruthy();
  });

  it("renders 'Save Task' and 'Cancel' buttons", () => {
    const { getByText } = render(<CreateTask route={route} />);
    expect(getByText("Save Task")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("triggers document picker on button press", () => {
    const { getByText } = render(<CreateTask route={route} />);
    const selectDocumentButton = getByText("Select Document");
    fireEvent.press(selectDocumentButton);
  });
});
