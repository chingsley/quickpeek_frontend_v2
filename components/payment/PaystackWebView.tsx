import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

/** Path (in the configured callback URL) that Paystack redirects to after checkout. */
const PAYSTACK_CALLBACK_PATH = 'paystack/callback';

type PaystackWebViewProps = {
  authorizationUrl: string;
  /** Paystack redirected back after checkout — the caller verifies server-side. */
  onComplete: () => void;
  onCancel: () => void;
};

/**
 * Hosted Paystack checkout in a modal WebView. Completion is detected by
 * watching for the callback URL in navigation changes; the money movement is
 * confirmed via the verify endpoint + webhook, never by the WebView alone.
 */
const PaystackWebView = ({ authorizationUrl, onComplete, onCancel }: PaystackWebViewProps) => {
  const handleNavigation = useCallback(
    (navState: WebViewNavigation) => {
      if (navState.url.includes(PAYSTACK_CALLBACK_PATH)) {
        onComplete();
      }
    },
    [onComplete],
  );

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete payment</Text>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel payment"
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.TEXT_DARK} />
          </Pressable>
        </View>
        <WebView
          source={{ uri: authorizationUrl }}
          onNavigationStateChange={handleNavigation}
          startInLoadingState
        />
      </View>
    </Modal>
  );
};

export default PaystackWebView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.CARD_BORDER,
  },
  title: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  closeButton: {
    padding: 8,
  },
});
