import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type KeyboardAwareScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  showsVerticalScrollIndicator?: boolean;
  bottomOffset?: number;
  keyboardDismissMode?: 'none' | 'interactive' | 'on-drag';
};

const KeyboardAwareScreen = ({
  children,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  bottomOffset = 24,
  keyboardDismissMode = 'interactive',
}: KeyboardAwareScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[
        { flexGrow: 1, paddingBottom: insets.bottom + bottomOffset },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardDismissMode={keyboardDismissMode}
      bottomOffset={bottomOffset}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

export default KeyboardAwareScreen;
