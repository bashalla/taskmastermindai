import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import EditCategoryScreen from "../components/EditCategoryScreen";
import { doc, updateDoc } from "firebase/firestore";

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => {
  const mockDocRef = {}; // Mock Firestore document reference
  return {
    doc: jest.fn(() => mockDocRef),
    updateDoc: jest.fn(() => Promise.resolve()),
  };
});

// Mock Firebase Firestore
jest.mock("../firebase", () => {
  const mockFirestore = {
    doc: jest.fn(() => ({
      // Mocking here the 'doc' function
    })),
    updateDoc: jest.fn(() => Promise.resolve()),
  };

  return {
    __esModule: true,
    db: mockFirestore,
    getFirestore: jest.fn(() => mockFirestore),
  };
});

// Mock external dependencies
jest.mock("@react-native-async-storage/async-storage", () => {
  return {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
});

// Mock React Navigation
const mockNavigation = {
  goBack: jest.fn(),
  setOptions: jest.fn(),
};
const mockRoute = {
  params: {
    category: {
      id: "1",
      name: "Test Category",
      label: "Test Label",
      color: "#ff6347",
    },
  },
};

// Test Suite
describe("EditCategoryScreen", () => {
  it("allows category update", async () => {
    const { getByText, getByPlaceholderText } = render(
      <EditCategoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Update category name
    fireEvent.changeText(
      getByPlaceholderText("Category Name"),
      "Updated Category Name"
    );
    fireEvent.press(getByText("Update Category"));

    // Check if updateDoc was called correctly
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      name: "Updated Category Name",
      label: "Test Label",
      color: "#ff6347",
    });
  });
});
