import React from "react";
import { render } from "@testing-library/react-native";
import LoginScreen from "../components/LoginScreen";
import { useNavigation } from "@react-navigation/core";

// Mock implementation
jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock external dependencies
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Test email input field
describe("LoginScreen", () => {
  it("should render the email input field", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText("Email");
    expect(emailInput).toBeTruthy();
  });

  // Test password input field
  it("should render the password input field", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const passwordInput = getByPlaceholderText("Password");
    expect(passwordInput).toBeTruthy();
  });

  // Test login button
  it("should render the login button", () => {
    const { getByText } = render(<LoginScreen />);
    const loginButton = getByText("Login");
    expect(loginButton).toBeTruthy();
  });

  // Test register button
  it("should render the register button", () => {
    const { getByText } = render(<LoginScreen />);
    const registerButton = getByText("Register");
    expect(registerButton).toBeTruthy();
  });

  // Test reset password button
  it("should render the reset password button", () => {
    const { getByText } = render(<LoginScreen />);
    const resetPasswordButton = getByText("Reset Password");
    expect(resetPasswordButton).toBeTruthy();
  });
});
