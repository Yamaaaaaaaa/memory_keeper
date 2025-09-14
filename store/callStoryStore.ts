import { create } from "zustand";

interface CallStoryState {
  id: string;
  hasStory: boolean;
  initialQuestion: {
    previousQA: string[];
    storyTitle: string;
    shareType: string;
  };
  setId: (newId: string) => void;
  clearId: () => void;
  setHasStory: (state: boolean) => void;
  setInitQuestion: (setInitQuestion: {
    previousQA: string[];
    storyTitle: string;
    shareType: string;
  }) => void;
  clearAll: () => void;
}

export const useCallStoryStore = create<CallStoryState>((set) => ({
  id: "",
  hasStory: false,
  initialQuestion: {
    previousQA: [],
    storyTitle: "",
    shareType: "",
  },
  setInitQuestion: (initialQuestion) => set({ initialQuestion }),
  setId: (newId) => set({ id: newId }),
  clearId: () => set({ id: "" }),
  setHasStory: (state) => set({ hasStory: state }),
  clearAll: () =>
    set({
      id: "",
      hasStory: false,
      initialQuestion: {
        previousQA: [],
        storyTitle: "",
        shareType: "",
      },
    }),
}));
