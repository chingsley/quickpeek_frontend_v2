import Axios from '@/config/axios.config';
import { TAnswerRequest, TConversationsResponse, TRequestDetail } from '@/types/answerRequest.types';
import { AnswerRequestStatus } from '@/types/answerRequest.types';

type PaginatedRequests = {
  items: TAnswerRequest[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
};

export const createRequest = async (questionId: string) => {
  const response = await Axios.post(`/questions/${questionId}/requests`);
  return response.data.data as { id: string; status: AnswerRequestStatus };
};

export const acceptRequest = async (requestId: string) => {
  const response = await Axios.post(`/requests/${requestId}/accept`);
  return response.data.data;
};

export const rejectRequest = async (requestId: string, rejectionReason: string) => {
  const response = await Axios.post(`/requests/${requestId}/reject`, { rejectionReason });
  return response.data.data;
};

export const getIncomingRequests = async (params?: {
  questionId?: string;
  status?: AnswerRequestStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedRequests> => {
  const search = new URLSearchParams();
  if (params?.questionId) search.set('questionId', params.questionId);
  if (params?.status) search.set('status', params.status);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const response = await Axios.get(`/requests/incoming${qs ? `?${qs}` : ''}`);
  return response.data.data as PaginatedRequests;
};

export const getOutgoingRequests = async (params?: {
  status?: AnswerRequestStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedRequests> => {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const response = await Axios.get(`/requests/outgoing${qs ? `?${qs}` : ''}`);
  return response.data.data as PaginatedRequests;
};

export const getRequestDetail = async (requestId: string): Promise<TRequestDetail> => {
  const response = await Axios.get(`/requests/${requestId}`);
  return response.data.data as TRequestDetail;
};

export const getRejectionReasons = async (): Promise<string[]> => {
  const response = await Axios.get('/requests/rejection-reasons');
  return response.data.data.items as string[];
};

export const getConversations = async (): Promise<TConversationsResponse> => {
  const response = await Axios.get('/requests/conversations');
  return response.data.data as TConversationsResponse;
};

export default {
  createRequest,
  acceptRequest,
  rejectRequest,
  getIncomingRequests,
  getOutgoingRequests,
  getRequestDetail,
  getRejectionReasons,
  getConversations,
};
