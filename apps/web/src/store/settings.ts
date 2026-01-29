import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider } from '@genomeforge/types';

interface SettingsState {
  aiProvider: AIProvider | null;
  theme: 'light' | 'dark' | 'system';
  // API keys are stored encrypted, not in plain text here
  hasApiKey: Record<AIProvider, boolean>;
  setAiProvider: (provider: AIProvider) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setApiKey: (provider: AIProvider, key: string) => Promise<void>;
  clearApiKey: (provider: AIProvider) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiProvider: null,
      theme: 'system',
      hasApiKey: {
        openai: false,
        anthropic: false,
        google: false,
        ollama: true // Ollama doesn't need a key
      },
      setAiProvider: (provider) => set({ aiProvider: provider }),
      setTheme: (theme) => set({ theme }),
      setApiKey: async (provider, _key) => {
        // TODO: Encrypt and store the key using @genomeforge/encryption
        // For now, just mark that we have a key
        set((state) => ({
          hasApiKey: { ...state.hasApiKey, [provider]: true }
        }));

        // Store encrypted key in IndexedDB
        // const encryption = new WebEncryption();
        // const encrypted = await encryption.encryptApiKey(key, devicePassword);
        // await db.settings.put({ key: `apiKey_${provider}`, value: encrypted, encrypted: true });
      },
      clearApiKey: (provider) => {
        set((state) => ({
          hasApiKey: { ...state.hasApiKey, [provider]: false }
        }));
      }
    }),
    {
      name: 'genomeforge-settings',
      partialize: (state) => ({
        aiProvider: state.aiProvider,
        theme: state.theme,
        hasApiKey: state.hasApiKey
      })
    }
  )
);
