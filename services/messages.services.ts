import Axios from '@/config/axios.config';
import { TMessage, TQuestionThread } from '@/types/message.types';

export const getQuestionThread = async (questionId: string): Promise<TQuestionThread> => {
  const response = await Axios.get(`/questions/${questionId}/messages/thread`);
  return response.data.data as TQuestionThread;
};

export const getMessages = async (questionId: string): Promise<TMessage[]> => {
  const response = await Axios.get(`/questions/${questionId}/messages`);
  return response.data.data as TMessage[];
};

export const sendMessage = async (questionId: string, text: string): Promise<TMessage> => {
  const response = await Axios.post(`/questions/${questionId}/messages`, { text });
  return response.data.data as TMessage;
};

export const markMessagesRead = async (questionId: string): Promise<void> => {
  await Axios.post(`/questions/${questionId}/messages/read`);
};

export const setResponseWindow = async (
  questionId: string,
  timeToRespondMs: number,
): Promise<{ respondByAt: string; systemMessage: TMessage }> => {
  const response = await Axios.post(`/questions/${questionId}/response-window`, {
    timeToRespondMs,
  });
  return {
    respondByAt: response.data.data.respondByAt,
    systemMessage: response.data.data.systemMessage as TMessage,
  };
};
