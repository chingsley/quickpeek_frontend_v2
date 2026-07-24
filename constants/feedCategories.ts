export const ALL_QUESTIONS_CATEGORY_KEY = 'all' as const;
export const INCOMING_CATEGORY_KEY = 'incoming' as const;
export const OUTGOING_CATEGORY_KEY = 'outgoing' as const;

export type DrawerMenuCategoryKey =
  | typeof ALL_QUESTIONS_CATEGORY_KEY
  | typeof INCOMING_CATEGORY_KEY
  | typeof OUTGOING_CATEGORY_KEY;

export type FeedCategoryDef = {
  key: DrawerMenuCategoryKey;
  title: string;
};

export const FEED_CATEGORY_DEFS: FeedCategoryDef[] = [
  { key: ALL_QUESTIONS_CATEGORY_KEY, title: 'All questions' },
  { key: INCOMING_CATEGORY_KEY, title: 'Incoming' },
  { key: OUTGOING_CATEGORY_KEY, title: 'Outgoing' },
];
