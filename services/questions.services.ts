import Axios from '@/config/axios.config';
import {
  TCreateQuestionPayload,
  TFeedResponse,
  TQuestion,
  TRejectedResponder,
  TSearchResponse,
  TAuthenticatedFeedResponse,
} from '@/types/question.types';

export const createQuestion = async (payload: TCreateQuestionPayload): Promise<TQuestion> => {
  const response = await Axios.post('/questions', payload);
  return response.data.data as TQuestion;
};

export const getQuestionFeed = async (params?: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  nearMe?: boolean;
  page?: number;
  limit?: number;
}): Promise<TAuthenticatedFeedResponse> => {
  const search = new URLSearchParams();
  if (params?.lat != null) search.set('lat', String(params.lat));
  if (params?.lng != null) search.set('lng', String(params.lng));
  if (params?.radiusKm != null) search.set('radiusKm', String(params.radiusKm));
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

export const getMyQuestions = async (): Promise<TQuestion[]> => {
  const response = await Axios.get('/questions/mine');
  return response.data.data as TQuestion[];
};

export const getQuestionDetail = async (questionId: string): Promise<TQuestion> => {
  const response = await Axios.get(`/questions/${questionId}`);
  return response.data.data as TQuestion;
};

export const markQuestionAnswered = async (questionId: string) => {
  const response = await Axios.post(`/questions/${questionId}/answered`);
  return response.data.data;
};

export const cancelQuestion = async (questionId: string) => {
  const response = await Axios.delete(`/questions/${questionId}`);
  return response.data.data;
};

export default {
  createQuestion,
  getQuestionFeed,
  searchQuestions,
  getMyQuestions,
  getQuestionDetail,
  markQuestionAnswered,
  cancelQuestion,
  getRejectedResponders,
  unblockResponder,
};
