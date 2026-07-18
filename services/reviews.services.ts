import Axios from '@/config/axios.config';
import { TReview, TReviewEligibility } from '@/types/review.types';

export const getReviewEligibility = async (questionId: string): Promise<TReviewEligibility> => {
  const response = await Axios.get(`/questions/${questionId}/review-eligibility`);
  return response.data.data as TReviewEligibility;
};

export const getMyReviewForQuestion = async (questionId: string): Promise<TReview | null> => {
  const response = await Axios.get(`/questions/${questionId}/my-review`);
  return response.data.data as TReview | null;
};

export const submitReview = async (
  questionId: string,
  stars: number,
  comment?: string,
): Promise<{ revealed: boolean; isRevealed: boolean }> => {
  const response = await Axios.post(`/questions/${questionId}/reviews`, { stars, comment });
  return response.data.data;
};

export const markQuestionAnswered = async (questionId: string) => {
  const response = await Axios.post(`/questions/${questionId}/answered`);
  return response.data.data;
};
