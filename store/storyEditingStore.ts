// store/storyEditingStore.ts
import { create } from "zustand";

type StoryType = "chat" | "call";
type ShareType = "myself" | "me_plus_one";

export interface InitQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  message_time: string; // ISO string
  speaker: string; // "bot" or userId
  speech: string;
}

export interface Conversation {
  id: string;
  conversation_start_date: string; // ISO string
  participants: string[];
  messages: ChatMessage[];
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

  // now single conversation per story
  conversation: Conversation | null;

  // setters
  updateStory: (partial: Partial<StoryEditingState>) => void;
  clearStory: () => void;

  // conversation setters
  setConversation: (conv: Conversation) => void;
  clearConversation: () => void;
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
  conversation: null,

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
      conversation: null,
    }),

  setConversation: (conv) =>
    set((state) => ({
      conversation: conv,
      conversation_id: conv.id, // keep conversation_id in story as well
    })),

  clearConversation: () =>
    set({
      conversation: null,
      conversation_id: "",
    }),
}));
