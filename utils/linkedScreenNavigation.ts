import { Router } from 'expo-router';

/** Set on question-detail when opened from chat so the next Open chat uses replace. */
export const LINKED_FROM_CHAT_PARAM = 'linkedFromChat';

type LinkedChatOptions = {
  /** Use replace when toggling back to chat after Go to Question. */
  replace?: boolean;
};

/**
 * Navigate from question detail to its answer-request chat.
 * Push preserves question detail on the back stack; replace avoids stacking
 * when the user is toggling Chat ↔ Question.
 */
export const openLinkedChat = (
  router: Router,
  requestId: string,
  options?: LinkedChatOptions,
) => {
  const route = { pathname: '/chat' as const, params: { requestId } };
  if (options?.replace) {
    router.replace(route);
  } else {
    router.push(route);
  }
};

export const openLinkedQuestionDetail = (
  router: Router,
  questionId: string,
  requestId: string,
) => {
  router.replace({
    pathname: '/question-detail',
    params: { questionId, [LINKED_FROM_CHAT_PARAM]: requestId },
  });
};
