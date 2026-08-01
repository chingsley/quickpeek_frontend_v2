import { render, screen } from '@testing-library/react-native';
import React from 'react';
import WalletLayout from '@/app/wallet/_layout';
import { Stack } from 'expo-router';

jest.mock('expo-router', () => ({
  Stack: jest.fn(() => null),
}));

jest.mock('@/components/shared/AuthGate', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'auth-gate' }, children),
  };
});

describe('WalletLayout', () => {
  it('wraps the stack in the auth gate with headers hidden', () => {
    render(<WalletLayout />);
    expect(screen.getByTestId('auth-gate')).toBeTruthy();
    expect(Stack).toHaveBeenCalledWith(
      expect.objectContaining({ screenOptions: { headerShown: false } }),
      undefined,
    );
  });
});
