jest.mock('@/config/axios.config', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import Axios from '@/config/axios.config';
import {
  createPaymentAccount,
  getBanks,
  getPaymentAccountStatus,
  getWallet,
  payForRequest,
  startPayoutOnboarding,
  verifyPayment,
} from '@/services/payments.services';
import { TPaymentAccount, TPaymentTransaction, TWallet } from '@/types/payment.types';

const mockGet = Axios.get as jest.Mock;
const mockPost = Axios.post as jest.Mock;

const account: TPaymentAccount = {
  id: 'pa_1',
  provider: 'STRIPE',
  currency: 'USD',
  status: 'ACTIVE',
  payoutsEnabled: true,
  customerId: 'cus_1',
  connectedAccountId: 'acct_1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const transaction: TPaymentTransaction = {
  id: 'tx_1',
  provider: 'STRIPE',
  type: 'QUESTION_PAYMENT',
  status: 'PENDING',
  amount: 25,
  currency: 'USD',
  platformFee: 0,
  payerId: 'u1',
  payeeId: 'u2',
  questionId: 'q1',
  answerRequestId: 'r1',
  providerRef: 'pi_1',
  failureReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('payments services', () => {
  it('creates a payment account', async () => {
    mockPost.mockResolvedValue({ data: { data: { account } } });
    const result = await createPaymentAccount('USD');
    expect(mockPost).toHaveBeenCalledWith('/payments/accounts', { currency: 'USD' });
    expect(result).toEqual(account);
  });

  it('fetches the payment account status', async () => {
    mockGet.mockResolvedValue({ data: { data: { account } } });
    expect(await getPaymentAccountStatus()).toEqual(account);

    mockGet.mockResolvedValue({ data: { data: { account: null } } });
    expect(await getPaymentAccountStatus()).toBeNull();
    expect(mockGet).toHaveBeenCalledWith('/payments/accounts/status');
  });

  it('starts payout onboarding', async () => {
    const payload = { bankCode: '058', accountNumber: '0123456789' };
    const responseBody = { account, accountName: 'KAMSI LOVELACE' };
    mockPost.mockResolvedValue({ data: { data: responseBody } });
    const result = await startPayoutOnboarding(payload);
    expect(mockPost).toHaveBeenCalledWith('/payments/accounts/onboarding', payload);
    expect(result).toEqual(responseBody);
  });

  it('lists banks', async () => {
    mockGet.mockResolvedValue({ data: { data: { banks: [{ name: 'GTBank', code: '058' }] } } });
    const result = await getBanks();
    expect(mockGet).toHaveBeenCalledWith('/payments/banks');
    expect(result).toEqual([{ name: 'GTBank', code: '058' }]);
  });

  it('initiates payment for a request', async () => {
    const payResponse = {
      transaction,
      stripe: { clientSecret: 'sec', customerId: 'cus_1', ephemeralKey: 'ek' },
    };
    mockPost.mockResolvedValue({ data: { data: payResponse } });
    const result = await payForRequest('r1');
    expect(mockPost).toHaveBeenCalledWith('/payments/pay', { answerRequestId: 'r1' });
    expect(result).toEqual(payResponse);
  });

  it('verifies a payment', async () => {
    mockPost.mockResolvedValue({ data: { data: { transaction } } });
    const result = await verifyPayment('tx_1');
    expect(mockPost).toHaveBeenCalledWith('/payments/pay/verify', { transactionId: 'tx_1' });
    expect(result).toEqual(transaction);
  });

  it('fetches the wallet without params', async () => {
    const wallet: TWallet = {
      totals: { earned: [], spent: [], questionsAnswered: 0 },
      transactions: { items: [], pagination: { page: 1, limit: 20, total: 0, hasMore: false } },
    };
    mockGet.mockResolvedValue({ data: { data: wallet } });
    const result = await getWallet();
    expect(mockGet).toHaveBeenCalledWith('/payments/wallet');
    expect(result).toEqual(wallet);
  });

  it('fetches the wallet with pagination params', async () => {
    mockGet.mockResolvedValue({ data: { data: {} } });
    await getWallet({ page: 2, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/payments/wallet?page=2&limit=10');
  });
});
