import { colors } from '@/constants/colors';
import { selectIsLoggedIn, useAuthStore } from '@/store/auth.store';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const Index = () => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoggedIn = useAuthStore(selectIsLoggedIn);

  if (!hasHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/Home" />;
  }

  return <Redirect href="/(auth)/signin" />;
};

export default Index;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.BG_WHITE,
  },
});
