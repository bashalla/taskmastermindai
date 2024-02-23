import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HomeScreen from "../components/HomeScreen";
import { auth } from "../firebase";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() =>
    Promise.resolve({ exists: () => true, data: () => ({}) })
  ),
  updateDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock("../firebase", () => ({
  auth: {
    currentUser: { uid: "user-id" },
    signOut: jest.fn().mockResolvedValue(),
  },
  db: {},
}));

describe("HomeScreen", () => {
  it("renders correctly", () => {
    const navigationMock = { addListener: jest.fn(() => () => {}) };
    const { getByText } = render(<HomeScreen navigation={navigationMock} />);
    expect(getByText("Today's Tasks")).toBeTruthy();
  });

  it("handles sign out correctly", async () => {
    const navigationMock = {
      replace: jest.fn(),
      addListener: jest.fn(() => () => {}),
    };
    const { getByTestId } = render(<HomeScreen navigation={navigationMock} />);

    const signOutButton = getByTestId("signOutButton");
    fireEvent.press(signOutButton);

    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
    });
  });
});
