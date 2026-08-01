import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { StyleSheet } from 'react-native';
import { TPaymentTransaction } from '@/types/payment.types';

export type MakePaymentSheetProps = {
  visible: boolean;
  onClose: () => void;
  answerRequestId: string;
  amount: number;
  currency: string;
  /** Called with the finalized transaction once the provider confirms payment. */
  onPaid?: (transaction: TPaymentTransaction) => void;
};

export const initiationErrorMessage = (error: unknown): string => {
  const apiError = (error as { response?: { data?: { error?: string } } })?.response?.data
    ?.error;
  return apiError ?? 'Payment failed to start. Please try again.';
};

export const makePaymentSheetStyles = StyleSheet.create({
  content: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  subtitle: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    marginTop: 8,
  },
  amount: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: 32,
    color: colors.PRIMARY,
    marginVertical: 20,
  },
  error: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.RED,
    marginBottom: 12,
  },
});
