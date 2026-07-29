import { DrawerMenuCategoryKey } from '@/constants/feedCategories';
import { colors } from '@/constants/colors';
import {
  MENU_CONTENT_WIDTH_RATIO,
  DRAWER_BRAND_BOTTOM_MARGIN,
  DRAWER_CATEGORY_HEADING_BOTTOM_GAP,
  DRAWER_CATEGORY_HEADING_FONT_SIZE,
  DRAWER_CATEGORY_ITEM_INSET,
  DRAWER_CONTENT_TOP_PADDING,
  DRAWER_ASK_BUTTON_BOTTOM_MARGIN,
} from '@/constants/drawer';
import { fonts } from '@/constants/fonts';
import { BORDER_RADIUS_BUTTON } from '@/constants/layout';
import {
  STATUS_ICON_NEUTRAL_COLOR,
  STATUS_ICON_SIZE,
  STATUS_ICON_VISUALS,
  StatusIconVisual,
} from '@/constants/statusIcons';
import { StatusIconGlyph } from '@/components/QuestionStatusIcons';
import { useAuthStore } from '@/store/auth.store';
import { DrawerMenuCategory, useDrawerStore } from '@/store/drawer.store';
import { images } from '@/constants/images';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Per-category icon. Incoming/Outgoing reuse the same status-icon visuals as
 * the Home filter chips so the drawer and the feed always agree. "All
 * questions" uses a stack glyph that reads as "everything in one pile".
 */
const allQuestionsIconVisual: StatusIconVisual = {
  name: 'layers-outline',
  color: STATUS_ICON_NEUTRAL_COLOR,
  bg: colors.TRANSPARENT,
};

const closedIconVisual: StatusIconVisual = {
  name: 'archive-outline',
  color: STATUS_ICON_NEUTRAL_COLOR,
  bg: colors.TRANSPARENT,
};

const categoryIconVisual = (key: DrawerMenuCategoryKey): StatusIconVisual => {
  if (key === 'incoming' || key === 'outgoing') {
    return STATUS_ICON_VISUALS[key];
  }
  if (key === 'closed') {
    return closedIconVisual;
  }
  return allQuestionsIconVisual;
};

/** Logo asset is 240×240; size to align with the brand title line height. */
const DRAWER_BRAND_LOGO_SIZE = 32;

type DrawerCategoriesSectionProps = {
  categories: DrawerMenuCategory[];
  selectedCategoryKey: DrawerMenuCategoryKey;
  onCategoryPress: (key: DrawerMenuCategoryKey) => void;
};

const DrawerCategoriesSection = ({
  categories,
  selectedCategoryKey,
  onCategoryPress,
}: DrawerCategoriesSectionProps) => (
  <View style={styles.categoriesSection}>
    <Text style={styles.categoryHeading}>CATEGORIES</Text>

    <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
      {categories.length === 0 ? (
        <Text style={styles.emptyCategories}>No categories available.</Text>
      ) : (
        categories.map((category) => {
          const isSelected = selectedCategoryKey === category.key;
          const iconVisual = categoryIconVisual(category.key);
          return (
            <Pressable
              key={category.key}
              style={styles.categoryRow}
              onPress={() => onCategoryPress(category.key)}
            >
              <View style={[styles.categoryRowContent, isSelected && styles.categoryRowSelected]}>
                <View style={styles.categoryTitleRow}>
                  <StatusIconGlyph
                    visual={iconVisual}
                    size={STATUS_ICON_SIZE}
                    color={isSelected ? colors.DARK_GRAY : colors.DARK_GRAY}
                  />
                  <Text style={[styles.categoryTitle, isSelected && styles.categoryTitleSelected]} numberOfLines={2}>
                    {category.title} ({category.count})
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  </View>
);

type DrawerAccountRowProps = {
  email: string;
  onPress: () => void;
};

const DrawerAccountRow = ({ email, onPress }: DrawerAccountRowProps) => (
  <Pressable style={styles.accountRow} onPress={onPress}>
    <Text style={styles.accountEmail} numberOfLines={1}>
      {email}
    </Text>
    <View style={styles.accountDots}>
      <Ionicons name="ellipsis-horizontal" size={22} color={colors.PRIMARY} />
    </View>
  </Pressable>
);

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
          paddingTop: insets.top + DRAWER_CONTENT_TOP_PADDING,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <Image
          source={images.logo}
          style={styles.brandLogo}
          accessibilityLabel="QuickPeek"
        />
        <Text style={styles.brand}>QuickPeek</Text>
      </View>

      <Pressable style={styles.askButton} onPress={handleAskQuestion}>
        <Ionicons name="add" size={18} color={colors.BG_WHITE} />
        <Text style={styles.askButtonText}>Ask a Question</Text>
      </Pressable>

      <View style={styles.categoriesSectionContainer}>
        <DrawerCategoriesSection
          categories={menuCategories}
          selectedCategoryKey={selectedCategoryKey}
          onCategoryPress={handleCategoryPress}
        />

        <DrawerAccountRow email={userEmail} onPress={openSettingsSheet} />
      </View>

    </View>
  );
};

export default HomeSideMenu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
    paddingHorizontal: 16,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: DRAWER_CATEGORY_ITEM_INSET,
    marginBottom: DRAWER_BRAND_BOTTOM_MARGIN,
  },
  brandLogo: {
    width: DRAWER_BRAND_LOGO_SIZE,
    height: DRAWER_BRAND_LOGO_SIZE,
  },
  brand: {
    fontFamily: 'roboto-bold',
    fontSize: 28,
    color: colors.TEXT_DARK,
  },
  askButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS_BUTTON,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginLeft: DRAWER_CATEGORY_ITEM_INSET,
    marginBottom: DRAWER_ASK_BUTTON_BOTTOM_MARGIN,
  },
  askButtonText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.BG_WHITE,
  },
  categoriesSectionContainer: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0,
    width: '100%',
    paddingRight: 10,
    // borderWidth: 1,
    // borderColor: 'red',
  },
  categoriesSection: {
    justifyContent: 'center',
    minHeight: 0,
    // borderWidth: 1,
  },
  categoryHeading: {
    fontFamily: 'roboto-medium',
    fontSize: DRAWER_CATEGORY_HEADING_FONT_SIZE,
    color: colors.MEDIUM_GRAY,
    letterSpacing: 1.2,
    marginBottom: DRAWER_CATEGORY_HEADING_BOTTOM_GAP,
    paddingLeft: DRAWER_CATEGORY_ITEM_INSET,
  },
  categoryList: {
    flexGrow: 0,
    flexShrink: 1,
    width: '100%',
  },
  emptyCategories: {
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.MEDIUM_GRAY,
    paddingLeft: DRAWER_CATEGORY_ITEM_INSET,
  },
  categoryRow: {
    paddingVertical: 4,
  },
  categoryRowContent: {
    alignSelf: 'stretch',
    paddingVertical: DRAWER_CATEGORY_ITEM_INSET,
    paddingHorizontal: DRAWER_CATEGORY_ITEM_INSET,
    width: '100%',
    // borderWidth: 1,
  },
  categoryRowSelected: {
    backgroundColor: colors.INPUT_BG,
    borderRadius: BORDER_RADIUS_BUTTON,
    borderWidth: 1,
    borderColor: colors.CARD_BG,
  },
  categoryTitle: {
    flex: 1,
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    lineHeight: 22,
  },
  categoryTitleSelected: {
    // color: colors.PRIMARY,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: colors.PRIMARY,
    lineHeight: 20,
  },
  accountDots: {
    paddingLeft: 4,
    paddingVertical: 4,
  },
});
