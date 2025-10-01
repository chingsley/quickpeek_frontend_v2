import { notifConfig } from '@/config';
import { colors } from '@/constants/colors';
import { PreferencesFormProps } from '@/types/signup.types';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const PreferencesForm: React.FC<PreferencesFormProps> = ({ formData, setFormData, nextStep, prevStep }) => {
  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const token = await notifConfig.registerForPushNotificationsAsync();
      if (token) {
        setFormData(prev => ({ ...prev, deviceToken: token }));
      }
    } else {
      setFormData(prev => ({ ...prev, deviceToken: '' }));
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

export default PreferencesForm;

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
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
});
