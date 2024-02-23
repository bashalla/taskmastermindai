import React from "react";
import { render } from "@testing-library/react-native";
import CompletedTaskScreen from "../components/CompletedTaskScreen";

// Mocking Ionicons
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");

describe("CompletedTaskScreen", () => {
  // Example task object to use as route parameter here
  const mockTask = {
    name: "Test Task",
    description: "This is a test description.",
    completedDate: "2023-01-01T12:00:00",
    createdAt: { seconds: 1672508400 },
    pointsAwarded: true,
  };

  // Mock navigation and route for props
  const mockNavigation = jest.fn();
  const mockRoute = {
    params: {
      task: mockTask,
    },
  };

  it("renders task details correctly", () => {
    const { getByText } = render(
      <CompletedTaskScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Verifying task name and description
    expect(getByText(mockTask.name)).toBeTruthy();
    expect(getByText(mockTask.description)).toBeTruthy();

    // Verifying completion date and duration
    expect(
      getByText(`Completed: ${mockTask.completedDate.split("T")[0]}`)
    ).toBeTruthy();
    expect(getByText("Duration: 1 day(s)")).toBeTruthy();

    // Verifying points information
    if (mockTask.pointsAwarded) {
      expect(getByText("You received 10 points!")).toBeTruthy();
    } else {
      expect(
        getByText("No points have been given for this task.")
      ).toBeTruthy();
    }
  });
});
