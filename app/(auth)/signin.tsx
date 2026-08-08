import FormField from '@/components/shared/FormField';
import CustomButton from '@/components/shared/CustomButton';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import { useActionSheet } from '@/components/shared/useActionSheet';
import { authScreenStyles } from '@/constants/authScreen';
import { notifConfig } from '@/config';
import { loginUser } from '@/services/auth.services';
import { useAuthStore } from '@/store/auth.store';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignIn = () => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('alice@quickpeek.com'); // TODO: Initialize to ''
  const [password, setPassword] = useState('password123'); // TODO: Initialize to ''
  const [isLoading, setIsLoading] = useState(false);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const { showActionSheet, actionSheet } = useActionSheet();

  const fieldErrors = useMemo(() => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Enter your email.';
    if (!password) errors.password = 'Enter your password.';
    return errors;
  }, [email, password]);

  const handleSignIn = async () => {
    if (Object.keys(fieldErrors).length > 0) {
      setShowFieldErrors(true);
      return;
    }

    setIsLoading(true);
    try {
      const deviceToken = await notifConfig.registerForPushNotificationsAsync();
      const deviceType = Platform.OS === 'web' ? 'web' : (Constants.platform?.ios ? 'ios' : 'android');

      const credentials = {
        email,
        password,
        deviceType,
        deviceToken: deviceToken,
        notificationsEnabled: !!deviceToken,
        // locationSharingEnabled intentionally omitted — login must not reset
        // the user's saved preference (the server only writes provided fields).
      };
      const response = await loginUser(credentials);

      if (response && response.data) {
        const { user, token } = response.data;
        await login(user.locationSharingEnabled, user, token);
        router.replace('/(tabs)/Home');
      } else {
        showActionSheet({
          title: 'Error',
          message: 'Invalid response from server',
          tone: 'error',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
      console.error('Login error:', error, '\errorMessage: ', errorMessage);
      showActionSheet({ title: 'Error', message: errorMessage, tone: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={authScreenStyles.safeArea}>
      <KeyboardAwareScreen contentContainerStyle={authScreenStyles.scrollContainer}>
        <View style={authScreenStyles.container}>
          <Text style={authScreenStyles.title}>Sign In</Text>
          <View style={authScreenStyles.form}>
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={showFieldErrors ? fieldErrors.email ?? null : null}
              testID="signin-email-input"
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              autoComplete="password"
              error={showFieldErrors ? fieldErrors.password ?? null : null}
              testID="signin-password-input"
            />
            <CustomButton
              text={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleSignIn}
              disabled={isLoading}
              loading={isLoading}
            />
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={authScreenStyles.link}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScreen>

      {actionSheet}
    </SafeAreaView>
  );
};

export default SignIn;
