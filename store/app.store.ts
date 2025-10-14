import { create } from "zustand";

interface AppState {
  loading: boolean;
  error: string | null;
  message: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMessage: (message: string | null) => void;
}

const useAppStore = create<AppState>((set) => ({
  loading: false,
  error: null,
  message: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setMessage: (message) => set({ message }),
}));

export default useAppStore;
