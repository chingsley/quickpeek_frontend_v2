import TLocation from "./location.types";

export enum QuestionStatus {
  Open = 'OPEN',
  Pending = 'PENDING',
  Resolved = 'RESOLVED',
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
  answerRating?: number;
  responderUsername?: string;
  claimedByUserId?: string;
};

export default TQuestion;