import TLocation from "./location.types";

export enum QuestionStatus {
  Open = 'OPEN',
  Assigned = 'ASSIGNED',
  Answered = 'ANSWERED',
  Expired = 'EXPIRED',
  Cancelled = 'CANCELLED',
}

export type TQuestion = {
  id: string;
  address: string;
  longitude: TLocation["longitude"];
  latitude: TLocation["latitude"];
  text: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: QuestionStatus;
  answer?: string;
  answerImageUrl?: string;
  answerRating?: number;
  answerId?: string;
  responderUsername?: string;
  responderId?: string;
  responderAverageRating?: number;
  questionerUsername?: string;
  questionerName?: string;
  questionerProfileImageUrl?: string | null;
  claimedByUserId?: string;
  assignedResponderId?: string;
  assignedResponderName?: string | null;
  assignedResponderUsername?: string | null;
  assignedResponderProfileImageUrl?: string | null;
  assignedAt?: string;
  timeToRespondMs?: number;
  respondByAt?: string | null;
  expiredAt?: string;
  lastMessage?: string | null;
};

export default TQuestion;
