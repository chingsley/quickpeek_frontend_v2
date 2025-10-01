import React from 'react';

export interface SignupFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  locationSharingEnabled: boolean;
  deviceToken: string;
  deviceType: string | undefined;
}

export interface UserDetailsFormProps {
  formData: SignupFormData;
  setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
  nextStep: () => void;
}

export interface PreferencesFormProps {
  formData: SignupFormData;
  setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
  nextStep: () => void;
  prevStep: () => void;
}

export interface ReviewDetailsProps {
  formData: SignupFormData;
  prevStep: () => void;
  handleSignup: () => void;
}
