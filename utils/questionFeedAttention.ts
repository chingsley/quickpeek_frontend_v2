import { TFeedQuestion } from '@/types/question.types';

export type QuestionCardRoute = {
  pathname: '/chat' | '/question-detail';
  params: { questionId?: string; requestId?: string; section?: string };
};

export const questionHasFeedAttention = (item: TFeedQuestion): boolean =>
  item.feedAttention?.hasAttention ?? false;

/**
 * Home card tap routing for questioners and responders.
 * Chat opens only when there are unread messages; otherwise question detail.
 */
export const resolveQuestionCardPress = (
  item: TFeedQuestion,
  viewerId: string | undefined,
): QuestionCardRoute => {
  const questionId = item.id;

  if (!viewerId) {
    return { pathname: '/question-detail', params: { questionId } };
  }

  const isOwner = item.userId === viewerId;
  const attention = item.feedAttention;
  const unreadMessageCount = attention?.unreadMessageCount ?? 0;

  if (isOwner && attention && attention.pendingIncomingCount > 0) {
    return {
      pathname: '/question-detail',
      params: { questionId, section: 'answer-requests' },
    };
  }

  if (isOwner && attention && attention.acceptedChatCount > 1 && unreadMessageCount > 0) {
    return {
      pathname: '/question-detail',
      params: { questionId, section: 'active-chats' },
    };
  }

  if (unreadMessageCount > 0) {
    const requestId = item.viewerRequest?.id ?? attention?.primaryChatRequestId ?? null;
    if (requestId) {
      return { pathname: '/chat', params: { requestId } };
    }
  }

  return { pathname: '/question-detail', params: { questionId } };
};
