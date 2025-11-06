import { TQuestion } from '@/types/question.types';
import { create } from 'zustand';

interface QuestionState {
  inboxQuestions: TQuestion[];
  outboxQuestions: TQuestion[];
  postedQuestion: TQuestion | null;
  setInboxQuestions: (questions: TQuestion[]) => void;
  setOutboxQuestions: (questions: TQuestion[]) => void;
  clearQuestions: () => void;
  dispatchNewQuestion: (questionData: TQuestion) => Promise<void>;
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  inboxQuestions: [],
  outboxQuestions: [],
  postedQuestion: null,

  setInboxQuestions: (questions) => set({ inboxQuestions: questions }),
  setOutboxQuestions: (questions) => set({ outboxQuestions: questions }),
  clearQuestions: () => set({ inboxQuestions: [], outboxQuestions: [] }),

  dispatchNewQuestion: async (questionData: TQuestion) => {
    const { outboxQuestions } = get();
    // Add the new question to outboxQuestions
    set({
      outboxQuestions: [questionData, ...outboxQuestions],
      postedQuestion: questionData,
    });
  },
}));