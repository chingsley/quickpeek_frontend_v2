
import { notifConfig } from '@/config';
import { colors } from '@/constants/colors';
import { registerUser } from '@/services/auth.services';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Define the shape of the form data
interface FormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  locationSharingEnabled: boolean;
  deviceToken: string;
  deviceType: string | undefined;
}

// Props for the step components
interface Step1Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  nextStep: () => void;
}

interface Step2Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  nextStep: () => void;
  prevStep: () => void;
}

interface Step3Props {
  formData: FormData;
  prevStep: () => void;
  handleSignup: () => void;
}

const Step1: React.FC<Step1Props> = ({ formData, setFormData, nextStep }) => {
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isNextDisabled =
    !formData.name ||
    !formData.username ||
    !formData.email ||
    !formData.password ||
    !formData.confirmPassword ||
    !passwordsMatch;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, formData.confirmPassword.length > 0 && !passwordsMatch && styles.inputError]}
          placeholder="Password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, formData.confirmPassword.length > 0 && !passwordsMatch && styles.inputError]}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry
        />
        {formData.confirmPassword.length > 0 && !passwordsMatch && <Text style={styles.errorText}>The two passwords do not match</Text>}
      </View>
      <TouchableOpacity style={[styles.button, isNextDisabled && styles.buttonDisabled]} onPress={nextStep} disabled={isNextDisabled}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const Step2: React.FC<Step2Props> = ({ formData, setFormData, nextStep, prevStep }) => {
  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const token = await notifConfig.registerForPushNotificationsAsync();
      if (token) {
        setFormData(prev => ({ ...prev, deviceToken: token }));
      }
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.switchContainer}>
        <Text>Enable Location Sharing</Text>
        <Switch
          value={formData.locationSharingEnabled}
          onValueChange={(value) => setFormData({ ...formData, locationSharingEnabled: value })}
        />
      </View>
      <View style={styles.switchContainer}>
        <Text>Enable Notifications</Text>
        <Switch
          value={!!formData.deviceToken}
          onValueChange={handleNotificationsToggle}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={nextStep}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={prevStep}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const Step3: React.FC<Step3Props> = ({ formData, prevStep, handleSignup }) => {
  return (
    <View style={styles.stepContainer}>
      <Text>Review your details:</Text>
      <Text>Name: {formData.name}</Text>
      <Text>Username: {formData.username}</Text>
      <Text>Email: {formData.email}</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={prevStep}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const Signup = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    locationSharingEnabled: false,
    deviceToken: '',
    deviceType: Constants.platform?.ios ? 'ios' : 'android',
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);


  const handleSignup = async () => {
    const { name, email, username, password, confirmPassword, } = formData;
    if (!name || !email || !password || !username || !confirmPassword) {
      Alert.alert('Error', 'Missing required field');
      return;
    }

    setIsLoading(true);
    try {
      const deviceToken = await notifConfig.registerForPushNotificationsAsync();
      setFormData(prev => ({ ...prev, deviceToken, notificationsEnabled: !!deviceToken }));

      const { confirmPassword: _, ...signupData } = formData;
      const response = await registerUser(signupData);
      console.log('Signup response:', JSON.stringify(response));
      router.replace('/(auth)/signin');
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
        return <Step1 formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 2:
        return <Step2 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step3 formData={formData} prevStep={prevStep} handleSignup={handleSignup} />;
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
  stepContainer: {
    width: '100%',
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
  buttonText: {
    color: colors.BG_WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.MEDIUM_GRAY,
  },
});
