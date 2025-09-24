
import { useAuth } from './../context/AuthContext';
import { Redirect } from 'expo-router';

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/Home" />;
  }

  return <Redirect href="/(auth)/signin" />;
};

export default Index;