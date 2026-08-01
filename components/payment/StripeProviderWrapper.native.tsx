import { StripeProvider } from '@stripe/stripe-react-native';
import React from 'react';

type StripeProviderWrapperProps = {
  children: React.ReactNode;
};

const StripeProviderWrapper = ({ children }: StripeProviderWrapperProps) => (
  <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}>
    <>{children}</>
  </StripeProvider>
);

export default StripeProviderWrapper;
