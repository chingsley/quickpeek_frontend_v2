import { TCategory } from './category.types';
import { CanRequestReason } from './answerRequest.types';

export enum QuestionStatus {
  Open = 'OPEN',
  Answered = 'ANSWERED',
  Cancelled = 'CANCELLED',
}

export type TQuestionerRating = {
  averageRating: number;
  reviewsCount: number;
};

export type TQuestion = {
  id: string;
  title: string;
  detail: string;
  categoryId: string;
  price: number;
  acceptanceCriteria: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  answerRadiusKm: number | null;
  userId: string;
  status: QuestionStatus;
  createdAt: string;
  answeredAt: string | null;
  category?: TCategory;
  distanceKm?: number | null;
  nearMe?: boolean;
  questioner?: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
    asResponder: TQuestionerRating;
    asQuestioner: TQuestionerRating;
  };
  canRequest?: boolean;
  canRequestReason?: CanRequestReason | null;
  existingRequestId?: string | null;
  viewerRequest?: TViewerRequest | null;
  requestCounts?: Partial<Record<string, number>>;
  requests?: Array<{
    id: string;
    status: string;
    responder: {
      id: string;
      name: string;
      username: string;
      profileImageUrl: string | null;
    };
    createdAt: string;
    respondedAt: string | null;
  }>;
};

export type TCreateQuestionPayload = {
  title: string;
  detail: string;
  price: number;
  acceptanceCriteria: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  answerRadiusKm?: number | null;
};

export type TViewerRequest = {
  id: string;
  status: string;
  rejectionReason: string | null;
  hasResponded: boolean;
  unreadCount: number;
  isBlocked: boolean;
};

export type TIncomingRequest = {
  id: string;
  status: string;
  unreadCount: number;
  responder: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
  };
};

export type FeedSectionKey =
  | 'awaiting_your_approval'
  | 'others'
  | 'pending'
  | 'approved'
  | 'answered_by_you'
  | 'rejected';

export type TFeedQuestion = TQuestion & {
  viewerRequest?: TViewerRequest | null;
  incomingRequest?: TIncomingRequest | null;
  sectionKey?: FeedSectionKey;
  questioner?: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
  } | null;
};

export type TFeedSection = {
  key: FeedSectionKey;
  title: string;
  items: TFeedQuestion[];
};

export type TSectionedFeedResponse = {
  sections: TFeedSection[];
};

export type TFeedResponse = {
  items: TQuestion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type TRejectedResponder = {
  responderId: string;
  rejectionReason: string | null;
  rejectedAt: string;
  responder: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
  };
};

export default TQuestion;
