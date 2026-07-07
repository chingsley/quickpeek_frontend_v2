import { TQuestion } from '@/types/question.types';
import { create } from 'zustand';

function dedupeQuestionsById(questions: TQuestion[]): TQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) {
      return false;
    }
    seen.add(question.id);
    return true;
  });
}

interface QuestionState {
  inboxQuestions: TQuestion[];
  outboxQuestions: TQuestion[];
  postedQuestion: TQuestion | null;
  setInboxQuestions: (questions: TQuestion[]) => void;
  prependInboxQuestion: (question: TQuestion) => void;
  updateInboxQuestion: (questionId: string, updates: Partial<TQuestion>) => void;
  mergeInboxQuestions: (questions: TQuestion[]) => void;
  setOutboxQuestions: (questions: TQuestion[]) => void;
  clearQuestions: () => void;
  dispatchNewQuestion: (questionData: TQuestion) => Promise<void>;
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  inboxQuestions: [],
  outboxQuestions: [],
  postedQuestion: null,

  setInboxQuestions: (questions) => set({ inboxQuestions: dedupeQuestionsById(questions) }),

  prependInboxQuestion: (question) => {
    const { inboxQuestions } = get();
    const withoutExisting = inboxQuestions.filter((q) => q.id !== question.id);
    set({ inboxQuestions: [question, ...withoutExisting] });
  },

  updateInboxQuestion: (questionId, updates) => {
    const { inboxQuestions } = get();
    set({
      inboxQuestions: inboxQuestions.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question
      ),
    });
  },

  mergeInboxQuestions: (questions) => {
    const { inboxQuestions } = get();
    set({ inboxQuestions: dedupeQuestionsById([...questions, ...inboxQuestions]) });
  },

  setOutboxQuestions: (questions) => set({ outboxQuestions: dedupeQuestionsById(questions) }),
  clearQuestions: () => set({ inboxQuestions: [], outboxQuestions: [] }),

  dispatchNewQuestion: async (questionData: TQuestion) => {
    const { outboxQuestions } = get();
    const withoutExisting = outboxQuestions.filter((q) => q.id !== questionData.id);
    set({
      outboxQuestions: [questionData, ...withoutExisting],
      postedQuestion: questionData,
    });
  },
}));