import 'react-native-gesture-handler';
import 'react-native-reanimated';


import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function RootLayout() {
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
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="answer/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="question-detail/index"
            options={{ headerShown: false }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
