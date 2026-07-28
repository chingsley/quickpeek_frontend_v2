import Axios from '@/config/axios.config';
import {
  TAuthenticatedFeedResponse,
  TClosedQuestionsResponse,
  TCreateQuestionPayload,
  TFeedResponse,
  TQuestion,
  TRejectedResponder,
  TSearchResponse,
} from '@/types/question.types';

export const createQuestion = async (payload: TCreateQuestionPayload): Promise<TQuestion> => {
  const response = await Axios.post('/questions', payload);
  return response.data.data as TQuestion;
};

export const getQuestionFeed = async (params?: {
  lat?: number;
  lng?: number;
  nearMe?: boolean;
  page?: number;
  limit?: number;
}): Promise<TAuthenticatedFeedResponse> => {
  const search = new URLSearchParams();
  if (params?.lat != null) search.set('lat', String(params.lat));
  if (params?.lng != null) search.set('lng', String(params.lng));
  if (params?.nearMe) search.set('nearMe', 'true');
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const response = await Axios.get(`/questions/feed${qs ? `?${qs}` : ''}`);
  const data = response.data?.data;

  if (!Array.isArray(data?.items) || !data?.counts) {
    throw new Error('Expected authenticated feed response');
  }

  return data as TAuthenticatedFeedResponse;
};

export const getMyClosedQuestions = async (): Promise<TClosedQuestionsResponse> => {
  const response = await Axios.get('/questions/mine/closed');
  const data = response.data?.data;

  if (!Array.isArray(data?.items)) {
    throw new Error('Expected closed questions response');
  }

  return data as TClosedQuestionsResponse;
};

export const getRejectedResponders = async (questionId: string): Promise<TRejectedResponder[]> => {
  const response = await Axios.get(`/questions/${questionId}/rejected-responders`);
  return response.data.data.items as TRejectedResponder[];
};

export const searchQuestions = async (query: string): Promise<TSearchResponse> => {
  const search = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) search.set('q', trimmed);
  const qs = search.toString();
  const response = await Axios.get(`/questions/search${qs ? `?${qs}` : ''}`);
  return response.data.data as TSearchResponse;
};

export const unblockResponder = async (questionId: string, responderId: string) => {
  const response = await Axios.delete(`/questions/${questionId}/rejected-responders/${responderId}`);
  return response.data;
};

export const getQuestionDetail = async (
  questionId: string,
  params?: { lat?: number; lng?: number },
): Promise<TQuestion> => {
  const search = new URLSearchParams();
  if (params?.lat != null) search.set('lat', String(params.lat));
  if (params?.lng != null) search.set('lng', String(params.lng));
  const qs = search.toString();
  const response = await Axios.get(`/questions/${questionId}${qs ? `?${qs}` : ''}`);
  return response.data.data as TQuestion;
};

export const getCloseReasons = async (): Promise<string[]> => {
  const response = await Axios.get('/questions/close-reasons');
  return response.data.data.items as string[];
};

export const closeQuestion = async (questionId: string, reason: string) => {
  const response = await Axios.post(`/questions/${questionId}/close`, { reason });
  return response.data.data;
};

export default {
  createQuestion,
  getQuestionFeed,
  getMyClosedQuestions,
  searchQuestions,
  getQuestionDetail,
  closeQuestion,
  getCloseReasons,
  getRejectedResponders,
  unblockResponder,
};
