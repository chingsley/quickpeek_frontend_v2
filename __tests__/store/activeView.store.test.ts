import { useActiveViewStore } from '@/store/activeView.store';

describe('activeView store', () => {
  beforeEach(() => {
    useActiveViewStore.setState({ activeRequestId: null, activeQuestionId: null });
  });

  it('tracks the open chat thread and question', () => {
    useActiveViewStore.getState().setActiveRequestId('req-1');
    useActiveViewStore.getState().setActiveQuestionId('q-1');

    expect(useActiveViewStore.getState().activeRequestId).toBe('req-1');
    expect(useActiveViewStore.getState().activeQuestionId).toBe('q-1');
  });

  it('clears the request id when it is still the active one', () => {
    useActiveViewStore.getState().setActiveRequestId('req-1');
    useActiveViewStore.getState().clearActiveRequestId('req-1');

    expect(useActiveViewStore.getState().activeRequestId).toBeNull();
  });

  it('does not clear a request id another screen already claimed', () => {
    // Chat A → chat B: B mounts before A unmounts, so A's cleanup must not
    // wipe B's id or suppression breaks for the screen actually on top.
    useActiveViewStore.getState().setActiveRequestId('req-a');
    useActiveViewStore.getState().setActiveRequestId('req-b');
    useActiveViewStore.getState().clearActiveRequestId('req-a');

    expect(useActiveViewStore.getState().activeRequestId).toBe('req-b');
  });

  it('does not clear a question id another screen already claimed', () => {
    useActiveViewStore.getState().setActiveQuestionId('q-a');
    useActiveViewStore.getState().setActiveQuestionId('q-b');
    useActiveViewStore.getState().clearActiveQuestionId('q-a');

    expect(useActiveViewStore.getState().activeQuestionId).toBe('q-b');
  });
});
