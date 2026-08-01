export type TPaymentProvider = 'STRIPE' | 'PAYSTACK';
export type TPaymentAccountStatus = 'PENDING' | 'ONBOARDING' | 'ACTIVE';
export type TTransactionStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export type TPaymentAccount = {
  id: string;
  provider: TPaymentProvider;
  currency: string;
  status: TPaymentAccountStatus;
  payoutsEnabled: boolean;
  customerId: string | null;
  connectedAccountId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TPaymentTransaction = {
  id: string;
  provider: TPaymentProvider;
  type: 'QUESTION_PAYMENT';
  status: TTransactionStatus;
  amount: number;
  currency: string;
  platformFee: number;
  payerId: string;
  payeeId: string;
  questionId: string | null;
  answerRequestId: string | null;
  providerRef: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TPayResponse = {
  transaction: TPaymentTransaction;
  stripe?: { clientSecret: string; customerId: string; ephemeralKey: string };
  paystack?: { authorizationUrl: string };
};

export type TOnboardingResponse = {
  account: TPaymentAccount;
  onboardingUrl?: string;
  accountName?: string;
};

export type TBank = { name: string; code: string };

export type TWalletCounterparty = {
  id: string;
  name: string;
  username: string;
};

export type TWalletTransaction = {
  id: string;
  type: 'QUESTION_PAYMENT';
  status: TTransactionStatus;
  amount: number;
  currency: string;
  platformFee: number;
  direction: 'earned' | 'spent';
  counterparty: TWalletCounterparty;
  question: { id: string; title: string } | null;
  answerRequestId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TCurrencyTotal = { currency: string; amount: number; count: number };

export type TWalletTotals = {
  /** Net of platform fees — what the responder actually received. */
  earned: TCurrencyTotal[];
  spent: TCurrencyTotal[];
  questionsAnswered: number;
};

export type TPagination = { page: number; limit: number; total: number; hasMore: boolean };

export type TWallet = {
  totals: TWalletTotals;
  transactions: { items: TWalletTransaction[]; pagination: TPagination };
};
