import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SearchScreen from "../components/SearchScreen";

// Mock Firestore's methods used in SearchScreen
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({
    // Mock collection names used in SearchScreen
  })),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: "1",
          data: () => ({ name: "Test Task", type: "Task" }),
        },
        {
          id: "2",
          data: () => ({ name: "Test Category", type: "Category" }),
        },
      ],
    })
  ),
}));

// Mock Firebase Auth
jest.mock("../firebase", () => ({
  auth: {
    currentUser: { uid: "testUid" },
  },
  db: {},
}));

describe("SearchScreen", () => {
  it("renders search input correctly", () => {
    const { getByPlaceholderText } = render(<SearchScreen />);
    expect(getByPlaceholderText("Search tasks or categories")).toBeTruthy();
  });

  it("displays search results correctly", async () => {
    const { getByPlaceholderText, findAllByText } = render(<SearchScreen />);
    const searchInput = getByPlaceholderText("Search tasks or categories");

    // Simulating here user typing a search query
    fireEvent.changeText(searchInput, "Test");
  });
});
