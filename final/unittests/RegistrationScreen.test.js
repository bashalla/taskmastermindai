import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RegisterScreen from "../components/RegisterScreen";

// Mock implementation
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Mock external dependencies
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Test Suite Registration Screen
describe("RegisterScreen", () => {
  it("renders all input fields", () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
    expect(getByPlaceholderText("First Name")).toBeTruthy();
    expect(getByPlaceholderText("Name")).toBeTruthy();
  });

  // Button tests
  it("renders gender selection buttons", () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText("Male")).toBeTruthy();
    expect(getByText("Female")).toBeTruthy();
    expect(getByText("Other")).toBeTruthy();
  });

  it("renders registration button", () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText("Register")).toBeTruthy();
  });
});
