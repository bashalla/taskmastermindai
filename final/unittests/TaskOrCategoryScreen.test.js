import React from "react";
import { render } from "@testing-library/react-native";
import TaskOrCategoryScreen from "../components/TaskOrCategoryScreen";

// Mocking Firebase and other external modules
jest.mock("../firebase", () => ({
  db: {},
  auth: {
    currentUser: {
      uid: "testUid",
    },
  },
}));

// Mocking Firestore's methods used in TaskOrCategoryScreen
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
  // Updating mock for getDocs to return an object with a docs property
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: "1",
          data: () => ({
            name: "Sample Category",
            label: "Sample Label",
            color: "#FFFFFF",
            userId: "testUid",
          }),
        },
      ],
    })
  ),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
}));

// TaskOrCategoryScreen tests
describe("TaskOrCategoryScreen", () => {
  it("renders without crashing", () => {
    // Rendering TaskOrCategoryScreen
    const { getByText, getByPlaceholderText } = render(
      <TaskOrCategoryScreen />
    );

    // Validating the rendered elements
    expect(getByText("Select an Existing Category")).toBeTruthy();
    expect(getByText("Or Create a New Category")).toBeTruthy();
    expect(getByPlaceholderText("Category Name")).toBeTruthy();
    expect(getByPlaceholderText("Label Name")).toBeTruthy();
  });
});
