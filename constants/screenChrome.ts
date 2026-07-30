import { StyleSheet } from 'react-native';
import {
  SCREEN_CHROME_ACTION_ROW_MARGIN_BOTTOM,
  SCREEN_CHROME_ACTION_ROW_MARGIN_TOP,
  SCREEN_CHROME_HORIZONTAL_PADDING,
  SCREEN_CHROME_TITLE_ROW_MARGIN_BOTTOM,
  SCREEN_CHROME_TITLE_ROW_MARGIN_TOP,
} from './layout';

/** Shared header chrome: action row (back/menu) + page title spacing. */
export const screenChromeStyles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_CHROME_HORIZONTAL_PADDING,
    marginTop: SCREEN_CHROME_ACTION_ROW_MARGIN_TOP,
    marginBottom: SCREEN_CHROME_ACTION_ROW_MARGIN_BOTTOM,
  },
  /** Action row without bottom margin (pinned toolbar, inline chat header). */
  actionRowInset: {
    paddingHorizontal: SCREEN_CHROME_HORIZONTAL_PADDING,
    marginTop: SCREEN_CHROME_ACTION_ROW_MARGIN_TOP,
  },
  titleRow: {
    paddingHorizontal: SCREEN_CHROME_HORIZONTAL_PADDING,
    marginTop: SCREEN_CHROME_TITLE_ROW_MARGIN_TOP,
    marginBottom: SCREEN_CHROME_TITLE_ROW_MARGIN_BOTTOM,
  },
  /** Title vertical rhythm when the parent already applies page horizontal padding. */
  titleRowInset: {
    marginTop: SCREEN_CHROME_TITLE_ROW_MARGIN_TOP,
    marginBottom: SCREEN_CHROME_TITLE_ROW_MARGIN_BOTTOM,
  },
});
