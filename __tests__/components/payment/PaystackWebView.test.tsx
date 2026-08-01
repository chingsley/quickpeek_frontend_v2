import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import PaystackWebView from '@/components/payment/PaystackWebView';

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    WebView: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: 'paystack-webview', ...props }),
  };
});

const triggerNavigation = (url: string) => {
  const webview = screen.getByTestId('paystack-webview');
  fireEvent(webview, 'onNavigationStateChange', { url });
};

describe('PaystackWebView', () => {
  it('renders the checkout URL in a webview', () => {
    render(
      <PaystackWebView
        authorizationUrl="https://paystack.test/pay/ref_1"
        onComplete={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    const webview = screen.getByTestId('paystack-webview');
    expect(webview.props.source).toEqual({ uri: 'https://paystack.test/pay/ref_1' });
  });

  it('completes when Paystack redirects to the callback URL', () => {
    const onComplete = jest.fn();
    render(
      <PaystackWebView
        authorizationUrl="https://paystack.test/pay/ref_1"
        onComplete={onComplete}
        onCancel={jest.fn()}
      />,
    );
    triggerNavigation('https://payments.quickpeek.local/paystack/callback?trxref=ref_1');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated navigation', () => {
    const onComplete = jest.fn();
    render(
      <PaystackWebView
        authorizationUrl="https://paystack.test/pay/ref_1"
        onComplete={onComplete}
        onCancel={jest.fn()}
      />,
    );
    triggerNavigation('https://paystack.test/pay/ref_1/auth');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cancels via the close button', () => {
    const onCancel = jest.fn();
    render(
      <PaystackWebView
        authorizationUrl="https://paystack.test/pay/ref_1"
        onComplete={jest.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(screen.getByLabelText('Cancel payment'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
