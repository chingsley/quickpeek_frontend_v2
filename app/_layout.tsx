import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAuthStore } from '@/store/auth.store';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from "expo-font";
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useFonts({
    'roboto': require('./../assets/fonts/Roboto-Regular.ttf'),
    'roboto-bold': require('./../assets/fonts/Roboto-Bold.ttf'),
    'roboto-light': require('./../assets/fonts/Roboto-Light.ttf'),
    'roboto-extralight': require('./../assets/fonts/Roboto-ExtraLight.ttf'),
    'roboto-medium': require('./../assets/fonts/Roboto-Medium.ttf'),
    'roboto-extrabold': require('./../assets/fonts/Roboto-ExtraBold.ttf'),
    'roboto-condensed-regular': require('./../assets/fonts/Roboto_Condensed-Regular.ttf'),
    'roboto-condensed-bold': require('./../assets/fonts/Roboto_Condensed-Bold.ttf'),
    'roboto-condensed-light': require('./../assets/fonts/Roboto_Condensed-Light.ttf'),
    'roboto-condensed-medium': require('./../assets/fonts/Roboto_Condensed-Medium.ttf'),
    'space-mono-regular': require('./../assets/fonts/SpaceMono-Regular.ttf'),
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Slot />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
