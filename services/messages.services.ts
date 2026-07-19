import Axios from '@/config/axios.config';
import { TMessage, TRequestThread } from '@/types/message.types';

export const getRequestThread = async (requestId: string): Promise<TRequestThread> => {
  const response = await Axios.get(`/requests/${requestId}/messages/thread`);
  return response.data.data as TRequestThread;
};

export const getMessages = async (requestId: string): Promise<TMessage[]> => {
  const response = await Axios.get(`/requests/${requestId}/messages`);
  return response.data.data as TMessage[];
};

export const sendMessage = async (requestId: string, text: string): Promise<TMessage> => {
  const response = await Axios.post(`/requests/${requestId}/messages`, { text });
  return response.data.data as TMessage;
};

export const markMessagesRead = async (requestId: string): Promise<void> => {
  await Axios.post(`/requests/${requestId}/messages/read`);
};
