import { authScreenStyles } from '@/constants/authScreen';
import PreferencesForm from '@/components/signup/PreferencesForm';
import ReviewDetails from '@/components/signup/ReviewDetails';
import UserDetailsForm from '@/components/signup/UserDetailsForm';
import KeyboardAwareScreen from '@/components/shared/KeyboardAwareScreen';
import { useActionSheet } from '@/components/shared/useActionSheet';
import { registerUser } from '@/services/auth.services';
import { SignupFormData } from '@/types/signup.types';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Signup = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showActionSheet, actionSheet } = useActionSheet();
  const [formData, setFormData] = useState<SignupFormData>({
    name: 'test03 quickpeek',
    username: 'test03',
    email: 'test03@quickpeek.com',
    password: 'password123',
    confirmPassword: 'password123',
    locationSharingEnabled: false,
    deviceToken: 'ExponentPushToken[ubw-MEPEIQgJdA3RQbGDrQ]',
    deviceType: Platform.OS === 'web' ? 'web' : (Constants.platform?.ios ? 'ios' : 'android'),
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSignup = async () => {
    const { name, email, username, password, confirmPassword } = formData;
    if (!name || !email || !password || !username || !confirmPassword) {
      showActionSheet({ title: 'Error', message: 'Missing required field', tone: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      showActionSheet({ title: 'Error', message: 'Passwords do not match', tone: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword: _, ...signupData } = formData;
      const response = await registerUser(signupData);

      if (response && response.data) {
        router.replace('/(auth)/signin');
      } else {
        showActionSheet({ title: 'Error', message: 'Invalid response from server', tone: 'error' });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Signup failed';
      console.error('Signup error:', error, '\errorMessage: ', errorMessage);
      showActionSheet({ title: 'Error', message: errorMessage, tone: 'error' });
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
    <SafeAreaView style={authScreenStyles.safeArea}>
      <KeyboardAwareScreen contentContainerStyle={authScreenStyles.scrollContainer}>
        <View style={authScreenStyles.container}>
          <Text style={authScreenStyles.title}>Sign Up - Step {step} of 3</Text>
          {renderStep()}
        </View>
      </KeyboardAwareScreen>

      {actionSheet}
    </SafeAreaView>
  );
};

export default Signup;