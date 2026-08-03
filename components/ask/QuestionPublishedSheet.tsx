import AnimatedSuccessMark from '@/components/ask/AnimatedSuccessMark';
import CustomButton from '@/components/shared/CustomButton';
import BottomSheet from '@/components/shared/BottomSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onPostAnother: () => void;
  onReturnHome: () => void;
};

const QuestionPublishedSheet = ({ visible, onPostAnother, onReturnHome }: Props) => (
  <BottomSheet visible={visible} onClose={onPostAnother} sheetStyle={styles.sheet}>
    <View style={styles.iconWrap}>
      <AnimatedSuccessMark active={visible} />
    </View>

    <Text style={styles.title}>Question published</Text>
    <Text style={styles.subtitle}>
      Your question is live. Responders can now request to answer it.
    </Text>

    <View style={styles.actions}>
      <CustomButton
        text="Post another question"
        onPress={onPostAnother}
        noTopMargin
        fullWidth
      />
      <Pressable
        onPress={onReturnHome}
        accessibilityRole="button"
        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
      >
        <Text style={styles.secondaryBtnText}>Return to home page</Text>
      </Pressable>
    </View>
  </BottomSheet>
);

export default QuestionPublishedSheet;

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
