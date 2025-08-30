/**
 * In this page you authenicate user.
 * - If user is logged in, redirect them to home page
 * - Else redirect them to auth page, where they can
 *    log in or register
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Index = () => {
  const router = useRouter();
  return (
    <View>
      <Text>Index</Text>
      <TouchableOpacity
        style={styles.btnGoHome}
        onPress={() => router.push('/(tabs)/Home')}
      >
        <Text>Go to Home Page</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  btnGoHome: {
    marginVertical: 20,
    borderWidth: 1,
    padding: 20,
    borderRadius: 8,
  }
});