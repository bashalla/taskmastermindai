import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RegisterScreen from "../components/RegisterScreen";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe("RegisterScreen", () => {
  it("renders all input fields", () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
    expect(getByPlaceholderText("First Name")).toBeTruthy();
    expect(getByPlaceholderText("Name")).toBeTruthy();
  });

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

  it("back button triggers navigation", () => {
    const { getByText } = render(<RegisterScreen />);
    const backButton = getByText("Back");
    fireEvent.press(backButton);
  });
});
