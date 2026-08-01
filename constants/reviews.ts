import { FilterTabletItem } from '@/constants/filterTablets';
import { ReviewSortOrder } from '@/utils/review.utils';

/** Max review comment length — kept in sync with backend validation. */
export const REVIEW_COMMENT_MAX_LENGTH = 1000;

export const REVIEW_SORT_TABLET_ITEMS: readonly FilterTabletItem<ReviewSortOrder>[] = [
  { key: 'desc', label: 'Best first', icon: 'star-outline' },
  { key: 'asc', label: 'Worst first', icon: 'star-outline' },
];
