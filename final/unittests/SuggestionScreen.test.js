import React from "react";
import { render } from "@testing-library/react-native";
import SuggestionsPage from "../components/SuggestionsScreen"; // Update the import path as necessary

// Mocking AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mocking Clipboard
jest.mock("expo-clipboard", () => ({
  setString: jest.fn(),
  getStringAsync: jest.fn(),
  addListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  removeListeners: jest.fn(),
}));

// Suggestion Screen Test Suite
describe("SuggestionsPage", () => {
  it("renders without crashing", () => {
    // Render the SuggestionPage component
    const route = { params: { suggestions: [] } };
    const navigation = { navigate: jest.fn() };

    const { queryByText } = render(
      <SuggestionsPage route={route} navigation={navigation} />
    );

    // Use a regular expression to match the part of the text content I want to test
    const helloText = queryByText(/Hello,/);
    expect(helloText).toBeTruthy();
  });
});
