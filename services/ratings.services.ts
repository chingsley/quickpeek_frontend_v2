import Axios from '@/config/axios.config';

/**
 * POST /ratings — rate a responder's answer.
 */
export const rateAnswer = async (answerId: string, rating: number, feedback?: string) => {
  const response = await Axios.post('/ratings', { answerId, rating, feedback });
  return response.data;
};

export default {
  rateAnswer,
};
