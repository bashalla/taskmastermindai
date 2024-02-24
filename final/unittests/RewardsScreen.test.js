import React from "react";
import { render } from "@testing-library/react-native";
import RewardsScreen from "../components/RewardsScreen";
import * as firebase from "firebase/auth";
import { db } from "../firebase";

// Mock the Firebase auth and Firestore
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock("../firebase", () => ({
  auth: {
    currentUser: {
      uid: "testUid",
    },
  },
  db: {},
}));

// Mock Firestore document retrieval
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        points: 100,
        firstName: "Test User",
      })),
    })
  ),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: jest.fn(),
    })
  ),
}));

describe("RewardsScreen Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test to check if the component renders correctly
  it("displays user points and type", async () => {
    const { findByText } = render(<RewardsScreen />);

    const pointsText = await findByText(/Points: 100/);
    expect(pointsText).toBeTruthy();

    // Expecting "Rookie" based on the provided points
    const userTypeText = await findByText(/User Type: Rookie/);
    expect(userTypeText).toBeTruthy();
  });

  // Test to check if the monthly competition header is rendered correctly
  it("renders the monthly competition header correctly", async () => {
    const { getByText } = render(<RewardsScreen />);
    expect(getByText(/Monthly Competition/)).toBeTruthy();
  });
});
