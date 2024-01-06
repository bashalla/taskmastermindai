import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../components/HomeScreen";

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => {
  return {
    collection: jest.fn(() => ({
      // Mock  collection() return
    })),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(() =>
      Promise.resolve({
        forEach: jest.fn(), // Mock forEach for getDocs
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
    expect(getByText("Today's Tasks")).toBeTruthy();
  });

  it("handles sign out correctly", () => {
    const navigationMock = { replace: jest.fn(), addListener: jest.fn() };
    const { getByText } = render(<HomeScreen navigation={navigationMock} />);

    // Mock the signOut function
    const signOutButton = getByText("Sign Out");
    fireEvent.press(signOutButton);

    //
    const { auth } = require("../firebase");
    expect(auth.signOut).toHaveBeenCalled();
  });
});
