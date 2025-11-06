import TLocation from "./location.types";

export enum QuestionStatus {
  New = 'NEW',
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
};

export default TQuestion;