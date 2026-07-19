import Axios from '@/config/axios.config';
import { TReview, TReviewEligibility } from '@/types/review.types';

export const getReviewEligibility = async (requestId: string): Promise<TReviewEligibility> => {
  const response = await Axios.get(`/requests/${requestId}/review-eligibility`);
  return response.data.data as TReviewEligibility;
};

export const getMyReviewForRequest = async (requestId: string): Promise<TReview | null> => {
  const response = await Axios.get(`/requests/${requestId}/my-review`);
  return response.data.data as TReview | null;
};

export const submitReview = async (
  requestId: string,
  stars: number,
  comment?: string,
): Promise<{ revealed: boolean; isRevealed: boolean }> => {
  const response = await Axios.post(`/requests/${requestId}/reviews`, { stars, comment });
  return response.data.data;
};
