import PreferencesForm from '@/components/signup/PreferencesForm';
import ReviewDetails from '@/components/signup/ReviewDetails';
import UserDetailsForm from '@/components/signup/UserDetailsForm';
import { registerUser } from '@/services/auth.services';
import { SignupFormData } from '@/types/signup.types';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

const Signup = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    name: 'test3 quickpeek',
    username: 'test3',
    email: 'test3@quickpeek.com',
    password: 'test3@quickpeek.com',
    confirmPassword: 'test3@quickpeek.com',
    locationSharingEnabled: false,
    deviceToken: 'ExponentPushToken[ubw-MEPEIQgJdA3RQbGDrQ]',
    deviceType: Constants.platform?.ios ? 'ios' : 'android',
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSignup = async () => {
    const { name, email, username, password, confirmPassword } = formData;
    if (!name || !email || !password || !username || !confirmPassword) {
      Alert.alert('Error', 'Missing required field');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting sign up with:', { email });

      const { confirmPassword: _, ...signupData } = formData;

      console.log('Sending signup request with credentials: ', signupData);
      const response = await registerUser(signupData);
      console.log('Signup response:', JSON.stringify(response));

      if (response && response.data) {
        console.log('Signup successful, navigating to signin');
        router.replace('/(auth)/signin');
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Signup failed';
      console.error('Signup error:', error, '\errorMessage: ', errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <UserDetailsForm formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 2:
        return <PreferencesForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <ReviewDetails formData={formData} prevStep={prevStep} handleSignup={handleSignup} />;
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Sign Up - Step {step} of 3</Text>
          {renderStep()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Signup;

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
});