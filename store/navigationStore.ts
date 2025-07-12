import { create } from 'zustand';

export interface NavigationState {
  forwardStack: string[];
  backStack: string[];

  pushToForward: (path: string) => void;
  popFromForward: () => string | undefined;
  clearForwardStack: () => void;

  pushToBack: (path: string) => void;
  popFromBack: () => string | undefined;
  clearBackStack: () => void;

  clearAllStacks: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  forwardStack: [],
  backStack: [],

  // Forward stack
  pushToForward: (path: string) =>
    set((state) => ({
      forwardStack: [...state.forwardStack, path],
    })),

  popFromForward: () => {
    let poppedPath: string | undefined;
    set((state) => {
      const updatedStack = [...state.forwardStack];
      poppedPath = updatedStack.pop();
      return { forwardStack: updatedStack };
    });
    return poppedPath;
  },

  clearForwardStack: () => set({ forwardStack: [] }),

  // Back stack
  pushToBack: (path: string) =>
    set((state) => ({
      backStack: [...state.backStack, path],
    })),

  popFromBack: () => {
    let poppedPath: string | undefined;
    set((state) => {
      const updatedStack = [...state.backStack];
      poppedPath = updatedStack.pop();
      return { backStack: updatedStack };
    });
    return poppedPath;
  },

  clearBackStack: () => set({ backStack: [] }),

  // Clear both
  clearAllStacks: () => set({ forwardStack: [], backStack: [] }),
}));
