import AnimatedSuccessMark from '@/components/ask/AnimatedSuccessMark';
import BottomSheet from '@/components/shared/BottomSheet';
import CustomButton from '@/components/shared/CustomButton';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ActionSheetTone = 'success' | 'info' | 'error';

export type ActionSheetButton = {
  label: string;
  onPress?: () => void;
  /** First button defaults to the filled primary style; mark extras 'secondary'. */
  role?: 'primary' | 'secondary';
};

export type ActionSheetConfig = {
  title: string;
  message?: string;
  tone?: ActionSheetTone;
  buttons?: ActionSheetButton[];
};

type ActionSheetProps = ActionSheetConfig & {
  visible: boolean;
  onClose: () => void;
};

/**
 * The app's Alert replacement: same bottom-sheet presentation as the
 * question-published sheet, with tone icon, title, message and one or more
 * action buttons. Works on every platform (Alert.alert is a no-op on web).
 */
const ActionSheet = ({
  visible,
  onClose,
  title,
  message,
  tone = 'info',
  buttons = [{ label: 'OK' }],
}: ActionSheetProps) => (
  <BottomSheet visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
    <View style={styles.iconWrap}>
      {tone === 'success' ? (
        <AnimatedSuccessMark active={visible} />
      ) : tone === 'error' ? (
        <View style={[styles.iconCircle, styles.iconCircleError]}>
          <Ionicons name="alert-circle" size={40} color={colors.RED} />
        </View>
      ) : (
        <View style={[styles.iconCircle, styles.iconCircleInfo]}>
          <Ionicons name="information-circle" size={40} color={colors.PRIMARY} />
        </View>
      )}
    </View>

    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.subtitle}>{message}</Text> : null}

    <View style={styles.actions}>
      {buttons.map((button, index) => {
        const isPrimary = (button.role ?? (index === 0 ? 'primary' : 'secondary')) === 'primary';
        const handlePress = () => {
          onClose();
          button.onPress?.();
        };
        return isPrimary ? (
          <CustomButton
            key={button.label}
            text={button.label}
            onPress={handlePress}
            noTopMargin
            fullWidth
          />
        ) : (
          <Pressable
            key={button.label}
            onPress={handlePress}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryBtnPressed,
            ]}
          >
            <Text style={styles.secondaryBtnText}>{button.label}</Text>
          </Pressable>
        );
      })}
    </View>
  </BottomSheet>
);

export default ActionSheet;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.BG_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleInfo: {
    backgroundColor: colors.SECONDARY,
  },
  iconCircleError: {
    backgroundColor: colors.LIGHT_RED,
  },
  title: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_XL,
    color: colors.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.FONT_FAMILY_REGULAR,
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actions: {
    alignSelf: 'stretch',
    width: '100%',
  },
  secondaryBtn: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.PRIMARY,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  secondaryBtnPressed: {
    opacity: 0.75,
  },
  secondaryBtnText: {
    fontFamily: fonts.FONT_FAMILY_BOLD,
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.PRIMARY,
  },
});
