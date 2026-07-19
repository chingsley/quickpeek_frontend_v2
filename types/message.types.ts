import { TCategory } from './category.types';
import { AnswerRequestStatus } from './answerRequest.types';

export type TMessage = {
  id: string;
  questionId: string;
  answerRequestId: string;
  senderId: string;
  text: string;
  type: 'USER' | 'SYSTEM';
  visibleToUserId: string | null;
  createdAt: string;
  readAt: string | null;
};

export type TRequestThread = {
  id: string;
  status: AnswerRequestStatus;
  canType: boolean;
  questionerId: string;
  responderId: string;
  question: {
    id: string;
    title: string;
    detail: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    category: TCategory;
  };
  counterparty: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
  } | null;
};
