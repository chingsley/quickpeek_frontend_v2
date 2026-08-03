import { Router } from 'expo-router';

/**
 * Navigate between a question and its answer-request chat without growing the
 * back stack — otherwise Chat ↔ Question toggles trap the user in a long loop.
 */
export const openLinkedChat = (router: Router, requestId: string) => {
  router.replace({ pathname: '/chat', params: { requestId } });
};

export const openLinkedQuestionDetail = (router: Router, questionId: string) => {
  router.replace({ pathname: '/question-detail', params: { questionId } });
};
