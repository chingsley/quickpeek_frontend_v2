import { DrawerMenuCategoryKey } from '@/constants/feedCategories';
import { colors } from '@/constants/colors';
import {
  MENU_CONTENT_WIDTH_RATIO,
  DRAWER_BRAND_CATEGORY_GAP,
  DRAWER_ASK_TO_CATEGORIES_GAP,
  DRAWER_CATEGORY_HEADING_FONT_SIZE,
  DRAWER_CATEGORY_ITEM_INSET,
} from '@/constants/drawer';
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
  const menuCategories = useDrawerStore((state) => state.menuCategories);
  const selectedCategoryKey = useDrawerStore((state) => state.selectedCategoryKey);
  const selectCategory = useDrawerStore((state) => state.selectCategory);
  const close = useDrawerStore((state) => state.close);
  const openSettingsSheet = useDrawerStore((state) => state.openSettingsSheet);

  const handleAskQuestion = () => {
    close();
    router.push('/ask');
  };

  const handleCategoryPress = (key: DrawerMenuCategoryKey) => {
    selectCategory(key);
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

      <Text style={styles.categoryHeading}>CATEGORIES</Text>

      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        {menuCategories.length === 0 ? (
          <Text style={styles.emptyCategories}>No categories available.</Text>
        ) : (
          menuCategories.map((category) => {
            const isSelected = selectedCategoryKey === category.key;
            return (
              <Pressable
                key={category.key}
                style={styles.categoryRow}
                onPress={() => handleCategoryPress(category.key)}
              >
                <View style={[styles.categoryRowContent, isSelected && styles.categoryRowSelected]}>
                  <Text
                    style={[styles.categoryTitle, isSelected && styles.categoryTitleSelected]}
                    numberOfLines={2}
                  >
                    {category.title} ({category.count})
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
    marginBottom: DRAWER_BRAND_CATEGORY_GAP,
    paddingLeft: DRAWER_CATEGORY_ITEM_INSET,
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
    marginBottom: DRAWER_ASK_TO_CATEGORIES_GAP,
    marginLeft: DRAWER_CATEGORY_ITEM_INSET,
  },
  askButtonText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_WHITE,
  },
  categoryHeading: {
    fontFamily: 'roboto-medium',
    fontSize: DRAWER_CATEGORY_HEADING_FONT_SIZE,
    color: colors.MEDIUM_GRAY,
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: DRAWER_CATEGORY_ITEM_INSET,
  },
  categoryList: {
    flex: 1,
  },
  emptyCategories: {
    fontFamily: 'roboto-light',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    paddingLeft: DRAWER_CATEGORY_ITEM_INSET,
  },
  categoryRow: {
    paddingVertical: 4,
  },
  categoryRowContent: {
    alignSelf: 'stretch',
    paddingVertical: 9,
    paddingLeft: DRAWER_CATEGORY_ITEM_INSET,
  },
  categoryRowSelected: {
    backgroundColor: colors.LIGHT_GREEN,
    borderRadius: 14,
    paddingRight: DRAWER_CATEGORY_ITEM_INSET,
  },
  categoryTitle: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    lineHeight: 22,
  },
  categoryTitleSelected: {
    color: colors.PRIMARY,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    marginTop: 4,
    paddingLeft: DRAWER_CATEGORY_ITEM_INSET,
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
