import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ProfileScreen from "../components/ProfileScreen";
import * as ImagePicker from "expo-image-picker";
import { updatePassword } from "firebase/auth";

// Mocking Firebase Initialization
jest.mock("firebase/auth", () => ({
  auth: jest.fn(),
  updatePassword: jest.fn(),
  deleteUser: jest.fn(),
}));

// Mocking Firebase Firestore
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        firstName: "John",
        lastName: "Doe",
        profileImageUrl: "path/to/image",
      }),
    })
  ),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

// Mocking Firebase Storage
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mocking Image Picker
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
}));

jest.mock("../firebase", () => ({
  auth: {
    currentUser: { uid: "testUid" },
  },
  db: {},
  storage: {},
}));

jest.mock("react-native-country-picker-modal", () => "CountryPicker");

jest.mock("expo-camera", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  Camera: {},
}));

jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));

// Profile Update Tests
describe("ProfileScreen", () => {
  it("renders the update profile button", () => {
    const { getByText } = render(<ProfileScreen />);
    const updateButton = getByText("Update Profile");
    expect(updateButton).toBeTruthy();
  });

  // Delete Account Test
  it("renders the delete account button", () => {
    const { getByText } = render(<ProfileScreen />);
    const deleteButton = getByText("Delete Account");
    expect(deleteButton).toBeTruthy();
  });
});
