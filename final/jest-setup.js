module.exports = {
  // ... other Jest configuration options
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native-vector-icons|other-module-to-transform)/)",
  ],
};
console.error = jest.fn();
