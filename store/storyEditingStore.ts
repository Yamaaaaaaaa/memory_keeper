import { create } from "zustand";
type StoryType = "chat" | "call";
type ShareType = "myself" | "me_plus_one";
export interface InitQuestion {
  id: string;
  question: string;
  answer: string;
}
export interface StoryEditingState {
  id: string;
  typeStory: StoryType;
  ownerId: string;
  processing: number;
  related_users: string[];
  shareType: ShareType;
  story_generated_date: Date;
  story_recited_date: Date;
  detail_story: string;
  sumary_story: string;
  title: string;
  initQuestions: InitQuestion[];

  call_id: string;
  conversation_id: string;

  // setter
  updateStory: (partial: Partial<StoryEditingState>) => void;
  clearStory: () => void;
}

export const useStoryEditingStore = create<StoryEditingState>((set) => ({
  id: "",
  typeStory: "chat",
  ownerId: "",
  processing: 0,
  related_users: [],
  shareType: "myself",
  story_generated_date: new Date(),
  story_recited_date: new Date(),
  detail_story: "",
  sumary_story: "",
  title: "",

  call_id: "",
  conversation_id: "",
  initQuestions: [],

  updateStory: (partial) =>
    set((state) => ({
      ...state,
      ...Object.fromEntries(
        Object.entries(partial).filter(([_, v]) => v !== undefined)
      ),
    })),
  clearStory: () =>
    set({
      id: "",
      typeStory: "chat",
      ownerId: "",
      processing: 0,
      related_users: [],
      shareType: "myself",
      story_generated_date: new Date(),
      story_recited_date: new Date(),
      detail_story: "",
      sumary_story: "",
      title: "",
      call_id: "",
      conversation_id: "",
      initQuestions: [],
    }),
}));
