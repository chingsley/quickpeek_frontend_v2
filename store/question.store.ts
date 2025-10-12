import TQuestion from '@/types/question.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  question: TQuestion | null;
  dispatchNewQuestion: (questionData: TQuestion) => Promise<void>;
}

export const useQuestionStore = create<AuthState>()(
  persist(
    (set, get) => ({
      question: null,

      dispatchNewQuestion: async (questionData: TQuestion) => {
        set({
          question: questionData,
        });
      },
    }),
    {
      name: 'question-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields to avoid storing functions
      partialize: (state) => ({
        question: state.question,
      }),
    }
  )
);