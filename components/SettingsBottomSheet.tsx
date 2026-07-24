import SettingsPanel from '@/components/SettingsPanel';
import BottomSheet from '@/components/shared/BottomSheet';
import { colors } from '@/constants/colors';
import { SETTINGS_SHEET_HEIGHT_RATIO } from '@/constants/drawer';
import { fonts } from '@/constants/fonts';
import { useDrawerStore } from '@/store/drawer.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsBottomSheet = () => {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const visible = useDrawerStore((state) => state.settingsSheetVisible);
  const closeSettingsSheet = useDrawerStore((state) => state.closeSettingsSheet);

  const sheetHeight = height * SETTINGS_SHEET_HEIGHT_RATIO;

  return (
    <BottomSheet
      visible={visible}
      onClose={closeSettingsSheet}
      backdropColor={colors.BACKDROP_LIGHT}
      sheetStyle={[
        styles.sheet,
        {
          height: sheetHeight,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Settings</Text>
        <Pressable style={styles.closeBtn} onPress={closeSettingsSheet}>
          <Ionicons name="close" size={22} color={colors.TEXT_DARK} />
        </Pressable>
      </View>

      <SettingsPanel showTitle={false} />
    </BottomSheet>
  );
};

export default SettingsBottomSheet;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.DARK_WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: colors.BG_BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_MEDIUM,
    color: colors.TEXT_DARK,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.BG_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
  },
});
