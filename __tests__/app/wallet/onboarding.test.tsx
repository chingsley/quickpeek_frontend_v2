import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import WalletOnboardingScreen from '@/app/wallet/onboarding';
import {
  createPaymentAccount,
  getBanks,
  getPaymentAccountStatus,
  startPayoutOnboarding,
} from '@/services/payments.services';
import { TPaymentAccount } from '@/types/payment.types';
import * as WebBrowser from 'expo-web-browser';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('@/services/payments.services', () => ({
  createPaymentAccount: jest.fn(),
  getBanks: jest.fn(),
  getPaymentAccountStatus: jest.fn(),
  startPayoutOnboarding: jest.fn(),
}));

jest.mock('@/components/shared/KeyboardAwareScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

const mockGetStatus = getPaymentAccountStatus as jest.Mock;
const mockCreateAccount = createPaymentAccount as jest.Mock;
const mockGetBanks = getBanks as jest.Mock;
const mockStartOnboarding = startPayoutOnboarding as jest.Mock;
const mockOpenBrowser = WebBrowser.openBrowserAsync as jest.Mock;

const account = (overrides: Partial<TPaymentAccount> = {}): TPaymentAccount => ({
  id: 'pa_1',
  provider: 'STRIPE',
  currency: 'USD',
  status: 'PENDING',
  payoutsEnabled: false,
  customerId: null,
  connectedAccountId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetStatus.mockResolvedValue(null);
  mockGetBanks.mockResolvedValue([
    { name: 'GTBank', code: '058' },
    { name: 'Zenith', code: '057' },
  ]);
});

describe('WalletOnboardingScreen', () => {
  it('shows a loading indicator while fetching the account', () => {
    mockGetStatus.mockImplementation(() => new Promise(() => {}));
    render(<WalletOnboardingScreen />);
    expect(screen.getByTestId('onboarding-loading')).toBeTruthy();
  });

  it('creates a Paystack account from the currency picker', async () => {
    mockCreateAccount.mockResolvedValue(account({ provider: 'PAYSTACK', currency: 'NGN' }));
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('NGN'));
    fireEvent.press(screen.getByText('Continue'));

    await waitFor(() => expect(mockCreateAccount).toHaveBeenCalledWith('NGN'));
    expect(await screen.findByText('GTBank')).toBeTruthy();
    expect(screen.getByText('Zenith')).toBeTruthy();
  });

  it('shows an error when account creation fails', async () => {
    mockCreateAccount.mockRejectedValue(new Error('boom'));
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('Continue'));
    expect(await screen.findByText(/could not create/i)).toBeTruthy();
  });

  it('treats an account-status failure as no account', async () => {
    mockGetStatus.mockRejectedValue(new Error('network'));
    render(<WalletOnboardingScreen />);
    expect(await screen.findByText('USD')).toBeTruthy();
  });

  it('runs Stripe onboarding in the browser and refreshes the status', async () => {
    mockGetStatus
      .mockResolvedValueOnce(account())
      .mockResolvedValueOnce(account({ payoutsEnabled: true, status: 'ACTIVE' }));
    mockStartOnboarding.mockResolvedValue({
      account: account({ status: 'ONBOARDING', connectedAccountId: 'acct_1' }),
      onboardingUrl: 'https://stripe.test/onboard',
    });
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('Continue with Stripe'));

    await waitFor(() =>
      expect(mockOpenBrowser).toHaveBeenCalledWith('https://stripe.test/onboard'),
    );
    expect(await screen.findByText(/payouts are active/i)).toBeTruthy();
  });

  it('skips the browser when Stripe returns no onboarding URL', async () => {
    mockGetStatus
      .mockResolvedValueOnce(account())
      .mockResolvedValueOnce(account({ status: 'ONBOARDING', connectedAccountId: 'acct_1' }));
    mockStartOnboarding.mockResolvedValue({ account: account({ status: 'ONBOARDING' }) });
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('Continue with Stripe'));

    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledTimes(2));
    expect(mockOpenBrowser).not.toHaveBeenCalled();
  });

  it('shows an error when Stripe onboarding fails', async () => {
    mockGetStatus.mockResolvedValue(account());
    mockStartOnboarding.mockRejectedValue(new Error('boom'));
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('Continue with Stripe'));
    expect(await screen.findByText(/could not start stripe onboarding/i)).toBeTruthy();
  });

  it('saves a Paystack payout account with bank details', async () => {
    mockGetStatus.mockResolvedValue(account({ provider: 'PAYSTACK', currency: 'NGN' }));
    mockStartOnboarding.mockResolvedValue({
      account: account({ provider: 'PAYSTACK', currency: 'NGN', payoutsEnabled: true, status: 'ACTIVE' }),
      accountName: 'ADA LOVELACE',
    });
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('GTBank'));
    fireEvent.changeText(screen.getByPlaceholderText('Account number'), '0123456789');
    fireEvent.press(screen.getByText('Save payout account'));

    await waitFor(() =>
      expect(mockStartOnboarding).toHaveBeenCalledWith({
        bankCode: '058',
        accountNumber: '0123456789',
      }),
    );
    expect(await screen.findByText(/ADA LOVELACE/)).toBeTruthy();
    expect(screen.getByText(/payouts are active/i)).toBeTruthy();
  });

  it('saves a Paystack payout account without a resolved name', async () => {
    mockGetStatus.mockResolvedValue(account({ provider: 'PAYSTACK', currency: 'NGN' }));
    mockStartOnboarding.mockResolvedValue({
      account: account({ provider: 'PAYSTACK', currency: 'NGN', payoutsEnabled: true, status: 'ACTIVE' }),
    });
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('GTBank'));
    fireEvent.changeText(screen.getByPlaceholderText('Account number'), '0123456789');
    fireEvent.press(screen.getByText('Save payout account'));

    expect(await screen.findByText(/settled to your payout account/i)).toBeTruthy();
  });

  it('validates bank details before saving', async () => {
    mockGetStatus.mockResolvedValue(account({ provider: 'PAYSTACK', currency: 'NGN' }));
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('Save payout account'));
    expect(await screen.findByText(/select a bank/i)).toBeTruthy();
    expect(mockStartOnboarding).not.toHaveBeenCalled();
  });

  it('shows an error when saving the Paystack account fails', async () => {
    mockGetStatus.mockResolvedValue(account({ provider: 'PAYSTACK', currency: 'NGN' }));
    mockStartOnboarding.mockRejectedValue(new Error('boom'));
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('Zenith'));
    fireEvent.changeText(screen.getByPlaceholderText('Account number'), '0123456789');
    fireEvent.press(screen.getByText('Save payout account'));

    expect(await screen.findByText(/could not save/i)).toBeTruthy();
  });

  it('shows an error when the bank list fails to load', async () => {
    mockGetStatus.mockResolvedValue(account({ provider: 'PAYSTACK', currency: 'NGN' }));
    mockGetBanks.mockRejectedValue(new Error('boom'));
    render(<WalletOnboardingScreen />);

    expect(await screen.findByText(/could not load the bank list/i)).toBeTruthy();
  });

  it('shows the active state and navigates back on Done', async () => {
    mockGetStatus.mockResolvedValue(account({ payoutsEnabled: true, status: 'ACTIVE' }));
    render(<WalletOnboardingScreen />);

    fireEvent.press(await screen.findByText('Done'));
    expect(mockBack).toHaveBeenCalled();
  });
});
