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
  categoryId: string;
  price: number;
  acceptanceCriteria: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  answerRadiusKm?: number | null;
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

export default TQuestion;
