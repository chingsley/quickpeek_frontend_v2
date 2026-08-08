import { create } from 'zustand';

/**
 * Tracks the conversation (and, optionally, question) currently in the
 * foreground so the push notification handler can suppress banners for
 * activity the user is already looking at.
 *
 * Keys are normalized resource ids (e.g. `answerRequestId`, `questionId`).
 * `null` means nothing relevant is open.
 */
interface ActiveViewStore {
  /** request id of the open chat thread, if any. */
  activeRequestId: string | null;
  /** question id of the open detail/question screen, if any. */
  activeQuestionId: string | null;
  setActiveRequestId: (id: string | null) => void;
  setActiveQuestionId: (id: string | null) => void;
  /** Clear only if `id` is still the active one — see note below. */
  clearActiveRequestId: (id: string) => void;
  clearActiveQuestionId: (id: string) => void;
}

/**
 * Clears are id-scoped because navigating chat A → chat B can mount B before
 * A unmounts. An unconditional clear in A's cleanup would then wipe B's id and
 * silently disable suppression for the screen the user is actually reading.
 */
export const useActiveViewStore = create<ActiveViewStore>((set) => ({
  activeRequestId: null,
  activeQuestionId: null,
  setActiveRequestId: (id) => set({ activeRequestId: id }),
  setActiveQuestionId: (id) => set({ activeQuestionId: id }),
  clearActiveRequestId: (id) =>
    set((state) => (state.activeRequestId === id ? { activeRequestId: null } : state)),
  clearActiveQuestionId: (id) =>
    set((state) => (state.activeQuestionId === id ? { activeQuestionId: null } : state)),
}));
