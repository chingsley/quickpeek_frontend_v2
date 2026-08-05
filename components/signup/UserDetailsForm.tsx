import CustomButton from '@/components/shared/CustomButton';
import FormField from '@/components/shared/FormField';
import { UserDetailsFormProps } from '@/types/signup.types';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FieldKey = 'name' | 'username' | 'email' | 'password' | 'confirmPassword';

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ formData, setFormData, nextStep, prevStep }) => {
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<FieldKey, string>> = {};
    if (!formData.name.trim()) errors.name = 'Enter your name.';
    if (!formData.username.trim()) errors.username = 'Choose a username.';
    if (!formData.email.trim()) errors.email = 'Enter your email.';
    if (!formData.password) errors.password = 'Enter a password.';
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirm your password.';
    else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'The two passwords do not match.';
    }
    return errors;
  }, [formData]);

  const fieldError = (key: FieldKey) => (showFieldErrors ? fieldErrors[key] ?? null : null);

  const handleNext = () => {
    if (Object.keys(fieldErrors).length > 0) {
      setShowFieldErrors(true);
      return;
    }
    nextStep();
  };

  return (
    <View style={styles.stepContainer}>
      <FormField
        label="Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Name"
        error={fieldError('name')}
        testID="signup-name-input"
      />
      <FormField
        label="Username"
        value={formData.username}
        onChangeText={(text) => setFormData({ ...formData, username: text })}
        placeholder="Username"
        autoCapitalize="none"
        error={fieldError('username')}
        testID="signup-username-input"
      />
      <FormField
        label="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={fieldError('email')}
        testID="signup-email-input"
      />
      <FormField
        label="Password"
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        placeholder="Password"
        secureTextEntry
        error={fieldError('password')}
        testID="signup-password-input"
      />
      <FormField
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
        placeholder="Confirm Password"
        secureTextEntry
        error={fieldError('confirmPassword')}
        testID="signup-confirm-password-input"
      />
      <CustomButton text="Next" onPress={handleNext} />
      <TouchableOpacity style={styles.backButton} onPress={prevStep}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserDetailsForm;

const styles = StyleSheet.create({
  stepContainer: {
    width: '100%',
  },
  backButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
