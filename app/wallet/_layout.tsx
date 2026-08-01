import AuthGate from '@/components/shared/AuthGate';
import { Stack } from 'expo-router';
import React from 'react';

export default function WalletLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
