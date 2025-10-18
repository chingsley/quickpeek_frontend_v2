import TLocation from "./location.types";

export enum QuestionStatus {
  New = 'New',
  Pending = 'Pending',
  Resolved = 'Resolved',
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
};

export default TQuestion;