import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Profile = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text>Profile</Text>
      <TouchableOpacity
        style={styles.newAskBtn}
        onPress={() => router.push('/newAsk')}
      >
        <Text>New Asks</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

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