import { colors } from '@/constants/colors';
import { ReviewDetailsProps } from '@/types/signup.types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ReviewDetails: React.FC<ReviewDetailsProps> = ({ formData, prevStep, handleSignup }) => {
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

export default ReviewDetails;

const styles = StyleSheet.create({
    stepContainer: {
        width: '100%',
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
});
