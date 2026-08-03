import { openLinkedChat, openLinkedQuestionDetail } from '@/utils/linkedScreenNavigation';
import { Router } from 'expo-router';

const mockRouterWithReplace = () => {
  const replace = jest.fn();
  return { replace, router: { replace } as unknown as Router };
};

describe('linkedScreenNavigation', () => {
  it('replaces the current screen when opening a linked chat', () => {
    const { replace, router } = mockRouterWithReplace();
    openLinkedChat(router, 'req-1');
    expect(replace).toHaveBeenCalledWith({
      pathname: '/chat',
      params: { requestId: 'req-1' },
    });
  });

  it('replaces the current screen when opening a linked question detail', () => {
    const { replace, router } = mockRouterWithReplace();
    openLinkedQuestionDetail(router, 'q-1');
    expect(replace).toHaveBeenCalledWith({
      pathname: '/question-detail',
      params: { questionId: 'q-1' },
    });
  });
});
