import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreateTask from "../components/CreateTask";

// Mocking Firebase Initialization
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

// Mock component test
describe("CreateTask", () => {
  const route = { params: { categoryId: "1" } };

  // render test
  it("renders all input fields", () => {
    const { getByPlaceholderText } = render(<CreateTask route={route} />);
    expect(getByPlaceholderText("Task Name")).toBeTruthy();
    expect(getByPlaceholderText("Description")).toBeTruthy();
  });

  // saveTaskButton test
  it("renders 'Save Task' button", () => {
    const { getByTestId } = render(<CreateTask route={route} />);
    expect(getByTestId("saveTaskButton")).toBeTruthy();
  });

  // selectDocumentButton test
  it("triggers document picker on button press", () => {
    const { getByTestId } = render(<CreateTask route={route} />);
    const selectDocumentButton = getByTestId("selectDocumentButton");
    fireEvent.press(selectDocumentButton);
  });
});
