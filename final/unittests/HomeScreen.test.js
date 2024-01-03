import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../components/HomeScreen";

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => {
  return {
    collection: jest.fn(() => ({
      // Mock what collection() should return, like a query or a document reference
    })),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(() =>
      Promise.resolve({
        forEach: jest.fn(), // Mock forEach for getDocs
        // Add other necessary mock implementations
      })
    ),
    doc: jest.fn(() => ({
      // Mock what doc() should return
    })),
    getDoc: jest.fn(() =>
      Promise.resolve({
        // Mock the response from getDoc
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          // Mock data returned from the document
        })),
      })
    ),
    updateDoc: jest.fn(() => Promise.resolve()),
    // Add any other Firestore functions used in HomeScreen
  };
});

// Mock Firebase Auth
jest.mock("../firebase", () => ({
  auth: {
    currentUser: { uid: "user-id" },
    signOut: jest.fn(() => Promise.resolve()), // Mock signOut function
  },
  db: {},
}));

describe("HomeScreen", () => {
  it("renders correctly", () => {
    const navigationMock = { addListener: jest.fn() };
    const { getByText } = render(<HomeScreen navigation={navigationMock} />);
    expect(getByText("Today's Tasks")).toBeTruthy(); // Replace with an actual text or element from your component
  });

  it("handles sign out correctly", () => {
    const navigationMock = { replace: jest.fn(), addListener: jest.fn() };
    const { getByText } = render(<HomeScreen navigation={navigationMock} />);

    // Update the way you locate the sign-out button, use getByText, getByTestId, or other queries based on your actual component
    const signOutButton = getByText("Sign Out"); // Replace with the actual text or testID of your sign-out button
    fireEvent.press(signOutButton);

    const { auth } = require("../firebase"); // Import auth here to get the mocked version
    expect(auth.signOut).toHaveBeenCalled(); // Check if the mocked signOut function was called
  });
});
