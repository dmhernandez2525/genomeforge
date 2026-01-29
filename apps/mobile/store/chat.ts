import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message, AIProvider } from '@/services/aiChat';

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  provider: AIProvider;
}

interface ChatStore {
  // State
  sessions: ChatSession[];
  currentSessionId: string | null;
  provider: AIProvider;
  model: string;

  // Getters
  getCurrentSession: () => ChatSession | null;

  // Actions
  setProvider: (provider: AIProvider) => void;
  setModel: (model: string) => void;
  createSession: () => string;
  selectSession: (sessionId: string | null) => void;
  addMessage: (message: Message) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
}

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateSessionTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }
  return 'New Chat';
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial State
      sessions: [],
      currentSessionId: null,
      provider: 'openai' as AIProvider,
      model: 'gpt-4-turbo-preview',

      // Getters
      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        if (!currentSessionId) return null;
        return sessions.find((s) => s.id === currentSessionId) || null;
      },

      // Actions
      setProvider: (provider) => set({ provider }),

      setModel: (model) => set({ model }),

      createSession: () => {
        const { provider } = get();
        const newSession: ChatSession = {
          id: generateSessionId(),
          title: 'New Chat',
          messages: [
            {
              id: `welcome_${Date.now()}`,
              role: 'assistant',
              content:
                "Hello! I'm your AI genetic assistant. I can help you understand your genetic data, explain variants, and answer questions about your analysis results. What would you like to know?",
              timestamp: new Date(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provider,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
        }));

        return newSession.id;
      },

      selectSession: (sessionId) =>
        set({
          currentSessionId: sessionId,
        }),

      addMessage: (message) =>
        set((state) => {
          const { currentSessionId, sessions } = state;
          if (!currentSessionId) return state;

          return {
            sessions: sessions.map((session) => {
              if (session.id !== currentSessionId) return session;

              const updatedMessages = [...session.messages, message];
              return {
                ...session,
                messages: updatedMessages,
                title:
                  session.title === 'New Chat'
                    ? generateSessionTitle(updatedMessages)
                    : session.title,
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        }),

      updateSessionTitle: (sessionId, title) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, title, updatedAt: new Date().toISOString() }
              : session
          ),
        })),

      deleteSession: (sessionId) =>
        set((state) => {
          const filteredSessions = state.sessions.filter((s) => s.id !== sessionId);
          return {
            sessions: filteredSessions,
            currentSessionId:
              state.currentSessionId === sessionId
                ? filteredSessions[0]?.id || null
                : state.currentSessionId,
          };
        }),

      clearAllSessions: () =>
        set({
          sessions: [],
          currentSessionId: null,
        }),
    }),
    {
      name: 'genomeforge-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions.slice(0, 50), // Keep last 50 sessions
        currentSessionId: state.currentSessionId,
        provider: state.provider,
        model: state.model,
      }),
    }
  )
);
