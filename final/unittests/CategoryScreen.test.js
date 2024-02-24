import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CategoryScreen from "../components/CategoryScreen";

// Mocking Firebase Initialization
jest.mock("../firebase", () => {
  const mockFirestore = {
    collection: jest.fn((_, collectionName) => ({ collectionName })),
    addDoc: jest.fn(() => Promise.resolve({ id: "mockId" })),
    getDocs: jest.fn(() =>
      Promise.resolve({
        docs: [
          {
            id: "1",
            data: () => ({
              name: "Category 1",
              label: "Label 1",
              color: "#ff6347",
              userId: "user-id",
            }),
          },
        ],
      })
    ),
    // Mocking the query function
    query: jest.fn(),
    where: jest.fn(),
    writeBatch: jest.fn(() => ({
      commit: jest.fn(),
      delete: jest.fn(),
    })),
    doc: jest.fn(),
  };

  // Mocking the getFirestore function
  const mockGetFirestore = jest.fn(() => mockFirestore);

  // Returning the mock functions if needed
  return {
    __esModule: true,
    auth: {
      currentUser: { uid: "user-id" },
    },
    db: mockFirestore,
    getFirestore: mockGetFirestore,
  };
});

// Mock external dependencies
jest.mock("react-native-vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("firebase/firestore", () => {
  return {
    collection: jest.fn((db, collectionName) => ({ db, collectionName })),
    addDoc: jest.fn((collectionRef, data) =>
      Promise.resolve({ id: "mock-doc-id", ...data })
    ),
    getDocs: jest.fn(() =>
      Promise.resolve({
        forEach: jest.fn((callback) => {
          // Mocked Firestore data
          const docs = [
            {
              id: "1",
              data: () => ({
                name: "Category 1",
                label: "Label 1",
                color: "#ff6347",
                userId: "user-id",
              }),
            },
            {
              id: "2",
              data: () => ({
                name: "Category 2",
                label: "Label 2",
                color: "#4682b4",
                userId: "user-id",
              }),
            },
          ];
          docs.forEach(callback);
        }),
      })
    ),
    query: jest.fn(),
    where: jest.fn(),
    writeBatch: jest.fn(() => {
      return {
        delete: jest.fn(),
        commit: jest.fn(() => Promise.resolve()),
      };
    }),
    doc: jest.fn(),
  };
});

// Mocking the useNavigation hook
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

// Mocking the useFocusEffect hook
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

const mockNavigation = {
  navigate: jest.fn(),
  addListener: jest.fn((_, fn) => fn()),
};

// Test suite for the CategoryScreen component
describe("CategoryScreen", () => {
  it("renders correctly", () => {
    // Passing the mockNavigation to my component
    const { getByText, getByPlaceholderText } = render(
      <CategoryScreen navigation={mockNavigation} />
    );
    // Checking if the component renders the expected elements
    expect(getByText("Select a Color:")).toBeTruthy();
    expect(getByPlaceholderText("Category Name")).toBeTruthy();
  });

  // Test case for category creation
  it("allows category creation", () => {
    const { getByText, getByPlaceholderText } = render(
      <CategoryScreen navigation={mockNavigation} />
    );
    const categoryNameInput = getByPlaceholderText("Category Name");
    fireEvent.changeText(categoryNameInput, "New Category");
    const addButton = getByText("+ Add Category");
    fireEvent.press(addButton);
  });
});
