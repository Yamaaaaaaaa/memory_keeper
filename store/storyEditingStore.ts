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
  messageTime: string; // ISO string
  speaker: string; // "bot" or userId
  speech: string;
}

export interface Conversation {
  id?: string;
  conversationStartDate: string; // ISO string
  participants: string[];
  messages: ChatMessage[];
}

export interface StoryEditingState {
  id: string;
  typeStory: StoryType;
  ownerId: string;
  processing: number;
  relatedUsers: string[];
  shareType: ShareType;
  storyGeneratedDate: string;
  storyRecitedDate: string;
  detailStory: string;
  sumaryStory: string;
  title: string;
  initQuestions: InitQuestion[];

  callId: string;
  conversationId: string;

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
  relatedUsers: [],
  shareType: "myself",
  storyGeneratedDate: new Date().toISOString(),
  storyRecitedDate: new Date().toISOString(),
  detailStory: "",
  sumaryStory: "",
  title: "",

  callId: "",
  conversationId: "",
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
      relatedUsers: [],
      shareType: "myself",
      storyGeneratedDate: new Date().toISOString(),
      storyRecitedDate: new Date().toISOString(),
      detailStory: "",
      sumaryStory: "",
      title: "",
      callId: "",
      conversationId: "",
      initQuestions: [],
      conversation: null,
    }),

  setConversation: (conv) =>
    set((state) => ({
      conversation: conv,
      conversationId: conv.id, // keep conversation_id in story as well
    })),

  clearConversation: () =>
    set({
      conversation: null,
      conversationId: "",
    }),
}));
