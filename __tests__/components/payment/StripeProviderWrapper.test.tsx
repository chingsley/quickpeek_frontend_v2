import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import StripeProviderWrapperNative from '@/components/payment/StripeProviderWrapper.native';
import StripeProviderWrapperWeb from '@/components/payment/StripeProviderWrapper.web';
import { StripeProvider } from '@stripe/stripe-react-native';

jest.mock('@stripe/stripe-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    StripeProvider: jest.fn(({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'stripe-provider' }, children),
    ),
  };
});

const mockStripeProvider = StripeProvider as unknown as jest.Mock;

describe('StripeProviderWrapper', () => {
  it('wraps children in the Stripe provider on native', () => {
    render(
      <StripeProviderWrapperNative>
        <Text>native child</Text>
      </StripeProviderWrapperNative>,
    );
    expect(screen.getByText('native child')).toBeTruthy();
    expect(screen.getByTestId('stripe-provider')).toBeTruthy();
    expect(mockStripeProvider).toHaveBeenCalledWith(
      expect.objectContaining({ publishableKey: expect.any(String) }),
      undefined,
    );
  });

  it('passes children through on web', () => {
    render(
      <StripeProviderWrapperWeb>
        <Text>web child</Text>
      </StripeProviderWrapperWeb>,
    );
    expect(screen.getByText('web child')).toBeTruthy();
    expect(screen.queryByTestId('stripe-provider')).toBeNull();
  });
});
