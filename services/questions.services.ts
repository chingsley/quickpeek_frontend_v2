import Axios from '@/config/axios.config';
import {
  TCreateQuestionPayload,
  TFeedResponse,
  TQuestion,
} from '@/types/question.types';

export const createQuestion = async (payload: TCreateQuestionPayload): Promise<TQuestion> => {
  const response = await Axios.post('/questions', payload);
  return response.data.data as TQuestion;
};

export const getQuestionFeed = async (params?: {
  categoryId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}): Promise<TFeedResponse> => {
  const search = new URLSearchParams();
  if (params?.categoryId) search.set('categoryId', params.categoryId);
  if (params?.lat != null) search.set('lat', String(params.lat));
  if (params?.lng != null) search.set('lng', String(params.lng));
  if (params?.radiusKm != null) search.set('radiusKm', String(params.radiusKm));
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const response = await Axios.get(`/questions/feed${qs ? `?${qs}` : ''}`);
  return response.data.data as TFeedResponse;
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
  getMyQuestions,
  getQuestionDetail,
  markQuestionAnswered,
  cancelQuestion,
};
