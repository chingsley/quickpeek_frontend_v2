import React from 'react';

type StripeProviderWrapperProps = {
  children: React.ReactNode;
};

/** Stripe React Native is not available on web — pass children through unchanged. */
const StripeProviderWrapper = ({ children }: StripeProviderWrapperProps) => <>{children}</>;

export default StripeProviderWrapper;
