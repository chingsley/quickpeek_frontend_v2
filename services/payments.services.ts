import Axios from '@/config/axios.config';
import {
  TBank,
  TOnboardingResponse,
  TPaymentAccount,
  TPaymentTransaction,
  TPayResponse,
  TWallet,
} from '@/types/payment.types';

export const createPaymentAccount = async (currency: string): Promise<TPaymentAccount> => {
  const response = await Axios.post('/payments/accounts', { currency });
  return response.data.data.account as TPaymentAccount;
};

export const getPaymentAccountStatus = async (): Promise<TPaymentAccount | null> => {
  const response = await Axios.get('/payments/accounts/status');
  return response.data.data.account as TPaymentAccount | null;
};

export const startPayoutOnboarding = async (payload: {
  country?: string;
  bankCode?: string;
  accountNumber?: string;
}): Promise<TOnboardingResponse> => {
  const response = await Axios.post('/payments/accounts/onboarding', payload);
  return response.data.data as TOnboardingResponse;
};

export const getBanks = async (): Promise<TBank[]> => {
  const response = await Axios.get('/payments/banks');
  return response.data.data.banks as TBank[];
};

export const payForRequest = async (answerRequestId: string): Promise<TPayResponse> => {
  const response = await Axios.post('/payments/pay', { answerRequestId });
  return response.data.data as TPayResponse;
};

export const verifyPayment = async (transactionId: string): Promise<TPaymentTransaction> => {
  const response = await Axios.post('/payments/pay/verify', { transactionId });
  return response.data.data.transaction as TPaymentTransaction;
};

export const getWallet = async (params?: {
  page?: number;
  limit?: number;
}): Promise<TWallet> => {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const response = await Axios.get(`/payments/wallet${qs ? `?${qs}` : ''}`);
  return response.data.data as TWallet;
};

export default {
  createPaymentAccount,
  getPaymentAccountStatus,
  startPayoutOnboarding,
  getBanks,
  payForRequest,
  verifyPayment,
  getWallet,
};
