import React from "react";
import { render } from "@testing-library/react-native";
import HelpScreen from "../components/HelpScreen";

// Mocking MaterialIcons
jest.mock("react-native-vector-icons/MaterialIcons", () => "Icon");

describe("HelpScreen", () => {
  it("renders header and sections correctly", () => {
    const { getByText } = render(<HelpScreen />);

    // Verify header
    expect(getByText("Help & Information")).toBeTruthy();

    // Verify sections
    expect(getByText("Point System & Gamification")).toBeTruthy();
    expect(
      getByText(/Each task completed on time earns you 10 points/)
    ).toBeTruthy();

    expect(getByText("Monthly Challenge")).toBeTruthy();
    expect(
      getByText(
        /Try the Monthly Challenge, as you can earn an extra 100 points/
      )
    ).toBeTruthy();

    expect(getByText("AI Scanner")).toBeTruthy();
    expect(
      getByText(/To identify important tasks, simply click on the lamp icon/)
    ).toBeTruthy();

    expect(getByText("Support")).toBeTruthy();
    expect(
      getByText(/If you encounter any issues or have queries/)
    ).toBeTruthy();
    expect(getByText("Mail")).toBeTruthy();
  });
});
