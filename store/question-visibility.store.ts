import { ssrSafeStorage } from '@/utils/ssr-safe-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface QuestionVisibilityState {
  seenQuestionIds: string[];
  markQuestionSeen: (questionId: string) => void;
  clearSeenQuestions: () => void;
}

export const useQuestionVisibilityStore = create<QuestionVisibilityState>()(
  persist(
    (set, get) => ({
      seenQuestionIds: [],

      markQuestionSeen: (questionId) => {
        const { seenQuestionIds } = get();
        if (seenQuestionIds.includes(questionId)) {
          return;
        }
        set({ seenQuestionIds: [...seenQuestionIds, questionId] });
      },

      clearSeenQuestions: () => set({ seenQuestionIds: [] }),
    }),
    {
      name: 'question-visibility',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({ seenQuestionIds: state.seenQuestionIds }),
    },
  ),
);
