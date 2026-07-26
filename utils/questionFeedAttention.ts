import { TFeedQuestion } from '@/types/question.types';

export type QuestionCardRoute = {
  pathname: '/chat' | '/question-detail';
  params: { questionId?: string; requestId?: string; section?: string };
};

export const questionHasFeedAttention = (item: TFeedQuestion): boolean =>
  item.feedAttention?.hasAttention ?? false;

/**
 * Home card tap routing for questioners and responders.
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

  if (!isOwner) {
    const requestId = item.viewerRequest?.id ?? attention?.primaryChatRequestId;
    if (requestId) {
      return { pathname: '/chat', params: { requestId } };
    }
    return { pathname: '/question-detail', params: { questionId } };
  }

  if (!attention) {
    return { pathname: '/question-detail', params: { questionId } };
  }

  if (attention.pendingIncomingCount > 0) {
    return {
      pathname: '/question-detail',
      params: { questionId, section: 'answer-requests' },
    };
  }

  if (attention.acceptedChatCount > 1 && attention.unreadMessageCount > 0) {
    return {
      pathname: '/question-detail',
      params: { questionId, section: 'active-chats' },
    };
  }

  if (attention.acceptedChatCount === 1 && attention.primaryChatRequestId) {
    return {
      pathname: '/chat',
      params: { requestId: attention.primaryChatRequestId },
    };
  }

  return { pathname: '/question-detail', params: { questionId } };
};
