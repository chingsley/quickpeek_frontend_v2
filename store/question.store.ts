import { TQuestion } from '@/types/question.types';
import { sortInboxQuestions, sortOutboxQuestions } from '@/utils/questions';
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
  removeInboxQuestion: (questionId: string) => void;
  setOutboxQuestions: (questions: TQuestion[]) => void;
  updateOutboxQuestion: (questionId: string, updates: Partial<TQuestion>) => void;
  clearQuestions: () => void;
  dispatchNewQuestion: (questionData: TQuestion) => Promise<void>;
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  inboxQuestions: [],
  outboxQuestions: [],
  postedQuestion: null,

  setInboxQuestions: (questions) =>
    set({ inboxQuestions: sortInboxQuestions(dedupeQuestionsById(questions)) }),

  prependInboxQuestion: (question) => {
    const { inboxQuestions } = get();
    const withoutExisting = inboxQuestions.filter((q) => q.id !== question.id);
    set({ inboxQuestions: sortInboxQuestions([question, ...withoutExisting]) });
  },

  updateInboxQuestion: (questionId, updates) => {
    const { inboxQuestions } = get();
    set({
      inboxQuestions: sortInboxQuestions(
        inboxQuestions.map((question) =>
          question.id === questionId ? { ...question, ...updates } : question,
        ),
      ),
    });
  },

  mergeInboxQuestions: (questions) => {
    const { inboxQuestions } = get();
    set({ inboxQuestions: sortInboxQuestions(dedupeQuestionsById([...questions, ...inboxQuestions])) });
  },

  removeInboxQuestion: (questionId) => {
    const { inboxQuestions } = get();
    set({ inboxQuestions: inboxQuestions.filter((q) => q.id !== questionId) });
  },

  setOutboxQuestions: (questions) =>
    set({ outboxQuestions: sortOutboxQuestions(dedupeQuestionsById(questions)) }),

  updateOutboxQuestion: (questionId, updates) => {
    const { outboxQuestions } = get();
    set({
      outboxQuestions: sortOutboxQuestions(
        outboxQuestions.map((question) =>
          question.id === questionId ? { ...question, ...updates } : question,
        ),
      ),
    });
  },

  clearQuestions: () => set({ inboxQuestions: [], outboxQuestions: [] }),

  dispatchNewQuestion: async (questionData: TQuestion) => {
    const { outboxQuestions } = get();
    const withoutExisting = outboxQuestions.filter((q) => q.id !== questionData.id);
    set({
      outboxQuestions: sortOutboxQuestions([questionData, ...withoutExisting]),
      postedQuestion: questionData,
    });
  },
}));
