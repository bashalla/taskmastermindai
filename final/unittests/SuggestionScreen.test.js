import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SuggestionsPage from "../components/SuggestionsScreen";

// Mock navigation functions
const mockNavigate = jest.fn();

// Mock the navigation prop
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock external dependencies
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe("SuggestionsPage", () => {
  it("navigates to TaskOrCategoryScreen when add button is pressed", () => {
    const { getByTestId } = render(
      <SuggestionsPage route={{ params: { suggestions: [] } }} />
    );

    // Get the add button by its testID
    const addButton = getByTestId("addButton");

    // Fire a press event on the add button
    fireEvent.press(addButton);

    // Asserting that the navigation function was called with the correct screen name
    expect(mockNavigate).toHaveBeenCalledWith("TaskOrCategoryScreen");
  });
});
