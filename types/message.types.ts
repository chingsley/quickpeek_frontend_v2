import { TCategory } from './category.types';
import { AnswerRequestStatus } from './answerRequest.types';

export type TMessageReplyBrief = {
  id: string;
  senderId: string;
  text: string;
};

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
  replyTo?: TMessageReplyBrief | null;
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
    price: number;
    status: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    category: TCategory;
  };
  payment: { status: 'PENDING' | 'SUCCEEDED' | 'FAILED' } | null;
  /** Currency a payment to the responder would be charged in (null = unknown). */
  payoutCurrency: string | null;
  counterparty: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
  } | null;
};
