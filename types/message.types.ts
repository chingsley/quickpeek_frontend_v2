export type TMessage = {
  id: string;
  questionId: string;
  senderId: string;
  text: string;
  type: 'USER' | 'SYSTEM';
  createdAt: string;
  readAt: string | null;
};

export type TQuestionThread = {
  id: string;
  text: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  userId: string;
  assignedResponderId: string | null;
  answeredAt: string | null;
  timeToRespondMs: number | null;
  respondByAt: string | null;
  createdAt: string;
  counterparty: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
  } | null;
};
