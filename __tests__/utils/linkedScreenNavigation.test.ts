import {
  LINKED_FROM_CHAT_PARAM,
  openLinkedChat,
  openLinkedQuestionDetail,
} from '@/utils/linkedScreenNavigation';
import { Router } from 'expo-router';

const mockRouter = () => {
  const push = jest.fn();
  const replace = jest.fn();
  return { push, replace, router: { push, replace } as unknown as Router };
};

describe('linkedScreenNavigation', () => {
  it('pushes chat by default so back returns to question detail', () => {
    const { push, replace, router } = mockRouter();
    openLinkedChat(router, 'req-1');
    expect(push).toHaveBeenCalledWith({
      pathname: '/chat',
      params: { requestId: 'req-1' },
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it('replaces chat when toggling from question detail after Go to Question', () => {
    const { push, replace, router } = mockRouter();
    openLinkedChat(router, 'req-1', { replace: true });
    expect(replace).toHaveBeenCalledWith({
      pathname: '/chat',
      params: { requestId: 'req-1' },
    });
    expect(push).not.toHaveBeenCalled();
  });

  it('replaces question detail and marks linked-from-chat when opened from chat', () => {
    const { replace, router } = mockRouter();
    openLinkedQuestionDetail(router, 'q-1', 'req-1');
    expect(replace).toHaveBeenCalledWith({
      pathname: '/question-detail',
      params: { questionId: 'q-1', [LINKED_FROM_CHAT_PARAM]: 'req-1' },
    });
  });
});
