import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Settings = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text>Settings</Text>
      <TouchableOpacity
        style={styles.newAskBtn}
        onPress={() => router.push('/')}
      >
        <Text>Answer Question</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  newAskBtn: {
    marginVertical: 20,
    borderWidth: 1,
    padding: 20,
    borderRadius: 8,
  }
});