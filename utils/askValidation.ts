import { formatMoney } from '@/utils/payment.utils';

/** Question-creation limits, mirroring the backend question validation. */
export const ASK_LIMITS = {
  titleMin: 5,
  titleMax: 120,
  detailMin: 10,
  detailMax: 2000,
  criteriaMin: 5,
  criteriaMax: 1000,
  priceMax: 10_000,
} as const;

export type AskFormValues = {
  title: string;
  price: string;
  detail: string;
  acceptanceCriteria: string;
};

export type AskFormErrors = Partial<
  Record<'title' | 'price' | 'detail' | 'acceptanceCriteria', string>
>;

/**
 * Field-level validation for the ask form. Every rule returns a
 * user-facing message so a tapped-early Publish button can point at the
 * exact culprit inputs instead of sitting disabled.
 */
export const validateAskForm = (values: AskFormValues): AskFormErrors => {
  const errors: AskFormErrors = {};

  if (values.title.trim().length < ASK_LIMITS.titleMin) {
    errors.title = `Give your question a title (at least ${ASK_LIMITS.titleMin} characters).`;
  }

  const price = parseFloat(values.price);
  if (values.price.trim() === '') {
    errors.price = 'Enter the amount you want to pay.';
  } else if (isNaN(price) || price <= 0) {
    errors.price = 'Enter an amount greater than $0.';
  } else if (price > ASK_LIMITS.priceMax) {
    errors.price = `Price cannot exceed ${formatMoney(ASK_LIMITS.priceMax, 'USD')}`;
  }

  if (values.detail.trim().length < ASK_LIMITS.detailMin) {
    errors.detail = `Describe what you need in at least ${ASK_LIMITS.detailMin} characters.`;
  }

  if (values.acceptanceCriteria.trim().length < ASK_LIMITS.criteriaMin) {
    errors.acceptanceCriteria = `State what a good answer looks like (at least ${ASK_LIMITS.criteriaMin} characters).`;
  }

  return errors;
};

export const hasAskErrors = (errors: AskFormErrors): boolean =>
  Object.values(errors).some(Boolean);
