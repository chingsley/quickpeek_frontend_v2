import { FeedSectionKey } from '@/types/question.types';

export const ALL_QUESTIONS_SECTION_KEY = 'all' as const;

export type DrawerMenuSectionKey = FeedSectionKey | typeof ALL_QUESTIONS_SECTION_KEY;

export type FeedSectionDef = {
  key: FeedSectionKey;
  title: string;
};

export const FEED_SECTION_DEFS: FeedSectionDef[] = [
  { key: 'awaiting_your_approval', title: 'Awaiting your approval' },
  { key: 'near_you', title: 'Near you' },
  { key: 'new', title: 'New questions' },
  { key: 'pending', title: 'Waiting for reply' },
  { key: 'approved', title: 'Approved to answer' },
  { key: 'answered_by_you', title: 'Answered by you' },
  { key: 'rejected', title: 'Rejected' },
];
