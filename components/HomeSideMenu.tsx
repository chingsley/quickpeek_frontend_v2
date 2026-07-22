import { DrawerMenuSectionKey } from '@/constants/feedSections';
import { colors } from '@/constants/colors';
import { MENU_CONTENT_WIDTH_RATIO, DRAWER_BRAND_SECTION_GAP, DRAWER_ASK_TO_SECTIONS_GAP, DRAWER_SECTION_HEADING_FONT_SIZE, DRAWER_SECTION_ITEM_INSET } from '@/constants/drawer';
import { fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/auth.store';
import { useDrawerStore } from '@/store/drawer.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeSideMenu = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const menuPanelWidth = width * MENU_CONTENT_WIDTH_RATIO;
  const userEmail = useAuthStore((state) => state.user?.email ?? '');
  const menuSections = useDrawerStore((state) => state.menuSections);
  const selectedSectionKey = useDrawerStore((state) => state.selectedSectionKey);
  const selectSection = useDrawerStore((state) => state.selectSection);
  const close = useDrawerStore((state) => state.close);
  const openSettingsSheet = useDrawerStore((state) => state.openSettingsSheet);

  const handleAskQuestion = () => {
    close();
    router.push('/ask');
  };

  const handleSectionPress = (key: DrawerMenuSectionKey) => {
    selectSection(key);
    router.push('/(tabs)/Home');
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: menuPanelWidth,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <Text style={styles.brand}>QuickPeek</Text>

      <Pressable style={styles.askButton} onPress={handleAskQuestion}>
        <Ionicons name="add" size={18} color={colors.BG_WHITE} />
        <Text style={styles.askButtonText}>Ask a Question</Text>
      </Pressable>

      <Text style={styles.sectionHeading}>SECTIONS</Text>

      <ScrollView style={styles.sectionList} showsVerticalScrollIndicator={false}>
        {menuSections.length === 0 ? (
          <Text style={styles.emptySections}>No filters available.</Text>
        ) : (
          menuSections.map((section) => {
            const isSelected = selectedSectionKey === section.key;
            return (
              <Pressable
                key={section.key}
                style={styles.sectionRow}
                onPress={() => handleSectionPress(section.key)}
              >
                <View style={[styles.sectionRowContent, isSelected && styles.sectionRowSelected]}>
                  <Text
                    style={[styles.sectionTitle, isSelected && styles.sectionTitleSelected]}
                    numberOfLines={2}
                  >
                    {section.title} ({section.count})
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable style={styles.accountRow} onPress={openSettingsSheet}>
        <Text style={styles.accountEmail} numberOfLines={1}>
          {userEmail}
        </Text>
        <View style={styles.accountDots}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.TEXT_DARK} />
        </View>
      </Pressable>
    </View>
  );
};

export default HomeSideMenu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.DARK_WHITE,
    paddingHorizontal: 24,
  },
  brand: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
    marginBottom: DRAWER_BRAND_SECTION_GAP,
    paddingLeft: DRAWER_SECTION_ITEM_INSET,
  },
  askButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.PRIMARY,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: DRAWER_ASK_TO_SECTIONS_GAP,
    marginLeft: DRAWER_SECTION_ITEM_INSET,
  },
  askButtonText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_WHITE,
  },
  sectionHeading: {
    fontFamily: 'roboto-medium',
    fontSize: DRAWER_SECTION_HEADING_FONT_SIZE,
    color: colors.MEDIUM_GRAY,
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: DRAWER_SECTION_ITEM_INSET,
  },
  sectionList: {
    flex: 1,
  },
  emptySections: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    paddingLeft: DRAWER_SECTION_ITEM_INSET,
  },
  sectionRow: {
    paddingVertical: 4,
  },
  sectionRowContent: {
    alignSelf: 'stretch',
    paddingVertical: 9,
    paddingLeft: DRAWER_SECTION_ITEM_INSET,
  },
  sectionRowSelected: {
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 14,
    paddingRight: DRAWER_SECTION_ITEM_INSET,
  },
  sectionTitle: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    lineHeight: 22,
  },
  sectionTitleSelected: {
    color: colors.PRIMARY,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    marginTop: 4,
    paddingLeft: DRAWER_SECTION_ITEM_INSET,
  },
  accountEmail: {
    flex: 1,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.DARK_GRAY,
    lineHeight: 20,
  },
  accountDots: {
    paddingLeft: 4,
    paddingVertical: 4,
  },
});
