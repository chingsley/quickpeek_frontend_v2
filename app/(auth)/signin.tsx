import { notifConfig } from '@/config';
import { colors } from '@/constants/colors';
import { loginUser } from '@/services/auth.services';
import { useAuthStore } from '@/store/auth.store';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';



const SignIn = () => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('test3@quickpeek.com'); // TODO: Initialize to ''
  const [password, setPassword] = useState('test3@quickpeek.com'); // TODO: Initialize to ''
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting sign in with:', { email });

      // Get device token for notifications
      const deviceToken = await notifConfig.registerForPushNotificationsAsync();
      const deviceType = Constants.platform?.ios ? 'ios' : 'android';

      const credentials = {
        email,
        password,
        deviceType,
        deviceToken: deviceToken, // || 'ExponentPushToken[ubw-MEPEIQgJdA3RQbGDrQ]',
        notificationsEnabled: !!deviceToken,
        locationSharingEnabled: false // Start with false, user can enable after login
      };

      console.log('Sending login request with credentials: ', credentials);
      const response = await loginUser(credentials);
      console.log('Login response:', JSON.stringify(response));

      if (response && response.data) {
        // Successful login - update auth store
        const { user, token } = response.data;
        await login(user.locationSharingEnabled, user, token);
        console.log('Login successful, navigating to home');
        router.replace('/(tabs)/Home');
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
      console.error('Login error:', error, '\errorMessage: ', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Sign In</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.link}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.MEDIUM_GRAY,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    color: 'blue',
  },
});