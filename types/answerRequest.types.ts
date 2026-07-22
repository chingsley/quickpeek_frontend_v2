import { TCategory } from './category.types';
import { TRoleRating } from './user.types';

export enum AnswerRequestStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED',
  ClosedAnswered = 'CLOSED_ANSWERED',
}

export type TCounterparty = {
  id: string;
  name: string;
  username: string;
  profileImageUrl: string | null;
  asResponder?: TRoleRating;
};

export type TAnswerRequest = {
  id: string;
  questionId: string;
  responderId: string;
  questionerId: string;
  status: AnswerRequestStatus;
  rejectionReason: string | null;
  createdAt: string;
  respondedAt: string | null;
  question?: {
    id: string;
    title: string;
    detail: string;
    price: number;
    status: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    answerRadiusKm?: number | null;
    category?: TCategory;
  };
  counterparty?: TCounterparty;
};

export type TRequestDetail = {
  id: string;
  questionId: string;
  responderId: string;
  questionerId: string;
  status: AnswerRequestStatus;
  rejectionReason: string | null;
  createdAt: string;
  respondedAt: string | null;
  canType: boolean;
  question: {
    id: string;
    title: string;
    detail: string;
    price: number;
    status: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    answerRadiusKm: number | null;
    category: TCategory;
  };
  counterparty: TCounterparty | null;
};

export type CanRequestReason =
  | 'OUTSIDE_RADIUS'
  | 'ALREADY_REQUESTED'
  | 'BLOCKED'
  | 'ANSWERED'
  | 'CANCELLED'
  | 'OWN_QUESTION'
  | 'NO_VIEWER_LOCATION';

export type TConversation = {
  requestId: string;
  questionId: string;
  status: AnswerRequestStatus;
  role: 'incoming' | 'outgoing';
  question: {
    id: string;
    title: string;
    status: string;
  };
  counterparty: TCounterparty;
  lastMessage: {
    text: string;
    type: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  hasUnread: boolean;
  sortAt: string;
  createdAt: string;
};

export type TConversationsResponse = {
  items: TConversation[];
  unreadTotal: number;
};

export default TAnswerRequest;
