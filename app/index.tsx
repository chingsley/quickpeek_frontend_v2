
import { useAuthStore } from '@/store/auth.store';
import { Redirect } from 'expo-router';

const Index = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/Home" />;
  }

  return <Redirect href="/(auth)/signin" />;
};

export default Index;