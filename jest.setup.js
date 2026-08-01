// Shared Jest setup for the frontend test harness.
// Reanimated drives the shared BottomSheet; its JS mock keeps render tests
// off the native/worklet path.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// Safe-area insets have no native provider under Jest. The package's own
// mock lives on the default export.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});
