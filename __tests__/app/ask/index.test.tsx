import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import AskScreen from '@/app/ask/index';
import { createQuestion } from '@/services/questions.services';
import useAppStore from '@/store/app.store';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/services/questions.services', () => ({
  createQuestion: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

jest.mock('@/components/shared/KeyboardAwareScreen', () => {
  const React = require('react');
  const { ScrollView } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(ScrollView, null, children),
  };
});

jest.mock('@/components/shared/BottomSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? React.createElement(View, { testID: 'question-published-sheet' }, children) : null,
  };
});

const mockCreateQuestion = createQuestion as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({ loading: false });
  mockCreateQuestion.mockResolvedValue({ id: 'q1' });
});

const fillForm = () => {
  fireEvent.changeText(screen.getByPlaceholderText('Short summary of what you need'), 'Best tacos?');
  fireEvent.changeText(screen.getByPlaceholderText(/Amount you want to pay/), '5');
  fireEvent.changeText(screen.getByPlaceholderText('Describe what you want to know...'), 'Where are they?');
  fireEvent.changeText(screen.getByPlaceholderText('What counts as a good answer?'), 'Name and address');
};

describe('AskScreen', () => {
  it('clears the form and shows the success sheet after publish', async () => {
    render(<AskScreen />);
    fillForm();
    fireEvent.press(screen.getByText('Publish question'));

    await waitFor(() => expect(mockCreateQuestion).toHaveBeenCalled());
    expect(await screen.findByTestId('question-published-sheet')).toBeTruthy();
    expect(screen.getByText('Question published')).toBeTruthy();
    expect(screen.getByPlaceholderText('Short summary of what you need').props.value).toBe('');
    expect(screen.getByPlaceholderText(/Amount you want to pay/).props.value).toBe('');
  });

  it('dismisses the sheet when posting another question', async () => {
    render(<AskScreen />);
    fillForm();
    fireEvent.press(screen.getByText('Publish question'));
    await screen.findByText('Post another question');

    fireEvent.press(screen.getByText('Post another question'));
    await waitFor(() => expect(screen.queryByTestId('question-published-sheet')).toBeNull());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns home from the success sheet', async () => {
    render(<AskScreen />);
    fillForm();
    fireEvent.press(screen.getByText('Publish question'));
    await screen.findByText('Return to home page');

    fireEvent.press(screen.getByText('Return to home page'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/Home');
  });
});
