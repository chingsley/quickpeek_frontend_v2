export const ALL_QUESTIONS_SECTION_KEY = 'all' as const;
export const INCOMING_SECTION_KEY = 'incoming' as const;
export const OUTGOING_SECTION_KEY = 'outgoing' as const;

export type DrawerMenuSectionKey =
  | typeof ALL_QUESTIONS_SECTION_KEY
  | typeof INCOMING_SECTION_KEY
  | typeof OUTGOING_SECTION_KEY;

export type FeedFilterDef = {
  key: DrawerMenuSectionKey;
  title: string;
};

export const FEED_FILTER_DEFS: FeedFilterDef[] = [
  { key: ALL_QUESTIONS_SECTION_KEY, title: 'All questions' },
  { key: INCOMING_SECTION_KEY, title: 'Incoming' },
  { key: OUTGOING_SECTION_KEY, title: 'Outgoing' },
];
