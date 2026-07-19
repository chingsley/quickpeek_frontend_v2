import { TQuestion } from '@/types/question.types';
import { create } from 'zustand';

function sortQuestions(questions: TQuestion[]): TQuestion[] {
  return [...questions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function dedupeById(questions: TQuestion[]): TQuestion[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

interface QuestionState {
  feedQuestions: TQuestion[];
  myQuestions: TQuestion[];
  setFeedQuestions: (questions: TQuestion[]) => void;
  appendFeedQuestions: (questions: TQuestion[]) => void;
  setMyQuestions: (questions: TQuestion[]) => void;
  updateMyQuestion: (questionId: string, updates: Partial<TQuestion>) => void;
  prependMyQuestion: (question: TQuestion) => void;
  clearQuestions: () => void;
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  feedQuestions: [],
  myQuestions: [],

  setFeedQuestions: (questions) =>
    set({ feedQuestions: dedupeById(sortQuestions(questions)) }),

  appendFeedQuestions: (questions) => {
    const { feedQuestions } = get();
    set({ feedQuestions: dedupeById(sortQuestions([...feedQuestions, ...questions])) });
  },

  setMyQuestions: (questions) =>
    set({ myQuestions: dedupeById(sortQuestions(questions)) }),

  updateMyQuestion: (questionId, updates) => {
    const { myQuestions } = get();
    set({
      myQuestions: sortQuestions(
        myQuestions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
      ),
    });
  },

  prependMyQuestion: (question) => {
    const { myQuestions } = get();
    const without = myQuestions.filter((q) => q.id !== question.id);
    set({ myQuestions: sortQuestions([question, ...without]) });
  },

  clearQuestions: () => set({ feedQuestions: [], myQuestions: [] }),
}));
