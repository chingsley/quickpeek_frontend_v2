import { TAnswerRequest } from '@/types/answerRequest.types';
import { AnswerRequestStatus } from '@/types/answerRequest.types';
import { create } from 'zustand';

function sortRequests(requests: TAnswerRequest[]): TAnswerRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

interface RequestState {
  incomingRequests: TAnswerRequest[];
  outgoingRequests: TAnswerRequest[];
  setIncomingRequests: (requests: TAnswerRequest[]) => void;
  setOutgoingRequests: (requests: TAnswerRequest[]) => void;
  updateIncomingRequest: (requestId: string, updates: Partial<TAnswerRequest>) => void;
  updateOutgoingRequest: (requestId: string, updates: Partial<TAnswerRequest>) => void;
  prependIncomingRequest: (request: TAnswerRequest) => void;
  prependOutgoingRequest: (request: TAnswerRequest) => void;
  clearRequests: () => void;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  incomingRequests: [],
  outgoingRequests: [],

  setIncomingRequests: (requests) => set({ incomingRequests: sortRequests(requests) }),
  setOutgoingRequests: (requests) => set({ outgoingRequests: sortRequests(requests) }),

  updateIncomingRequest: (requestId, updates) => {
    const { incomingRequests } = get();
    set({
      incomingRequests: sortRequests(
        incomingRequests.map((r) => (r.id === requestId ? { ...r, ...updates } : r)),
      ),
    });
  },

  updateOutgoingRequest: (requestId, updates) => {
    const { outgoingRequests } = get();
    set({
      outgoingRequests: sortRequests(
        outgoingRequests.map((r) => (r.id === requestId ? { ...r, ...updates } : r)),
      ),
    });
  },

  prependIncomingRequest: (request) => {
    const { incomingRequests } = get();
    const without = incomingRequests.filter((r) => r.id !== request.id);
    set({ incomingRequests: sortRequests([request, ...without]) });
  },

  prependOutgoingRequest: (request) => {
    const { outgoingRequests } = get();
    const without = outgoingRequests.filter((r) => r.id !== request.id);
    set({ outgoingRequests: sortRequests([request, ...without]) });
  },

  clearRequests: () => set({ incomingRequests: [], outgoingRequests: [] }),
}));

export { AnswerRequestStatus };
