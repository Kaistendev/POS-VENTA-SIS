import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      isOpen: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setLoading: (loading) => set({ isLoading: loading }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'ai-chat-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
);
