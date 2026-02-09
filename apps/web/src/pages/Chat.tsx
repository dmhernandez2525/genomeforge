import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';
import { useAnalysisStore } from '../store/analysis';
import { useSettingsStore } from '../store/settings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const genome = useGenomeStore((state) => state.genome);
  const { matchResult } = useAnalysisStore();
  const { aiProvider, hasApiKey } = useSettingsStore();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !aiProvider || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);
    setStreamingContent('');

    try {
      const { AIClient } = await import('@genomeforge/core');

      // Get API key from localStorage
      const apiKeyStorageKey = `genomeforge_apikey_${aiProvider}`;
      const apiKey = localStorage.getItem(apiKeyStorageKey);

      if (!apiKey && aiProvider !== 'ollama') {
        throw new Error(`No API key found for ${aiProvider}. Please configure in Settings.`);
      }

      // Create AI client
      const client = new AIClient({
        config: {
          provider: aiProvider,
          apiKey: apiKey || undefined,
          model: getDefaultModel(aiProvider),
          baseUrl: aiProvider === 'ollama' ? 'http://localhost:11434' : undefined
        }
      });

      // Build messages array for the AI client
      const chatMessages = messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }));

      // Add the new user message
      chatMessages.push({
        role: 'user' as const,
        content: userMessage.content
      });

      // Send message
      const response = await client.chat(chatMessages);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [message, aiProvider, messages, matchResult, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, []);

  if (!genome) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">No Genome Loaded</h1>
        <p className="mt-2 text-gray-600">Upload a genome file to chat about your results.</p>
        <Link
          to="/upload"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
        >
          Upload Genome
        </Link>
      </div>
    );
  }

  if (!aiProvider) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">AI Not Configured</h1>
        <p className="mt-2 text-gray-600">Configure an AI provider to chat about your genome.</p>
        <Link
          to="/settings"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
        >
          Configure AI
        </Link>
      </div>
    );
  }

  const providerConfigured = aiProvider === 'ollama' || hasApiKey[aiProvider];

  if (!providerConfigured) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">API Key Required</h1>
        <p className="mt-2 text-gray-600">Add your {aiProvider} API key to start chatting.</p>
        <Link
          to="/settings"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
        >
          Add API Key
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)]">
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between sm:mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Chat with AI</h1>
          <p className="text-xs text-gray-600 sm:text-sm">
            Ask questions about your genetic findings. Using{' '}
            <span className="font-medium text-primary-600">{aiProvider}</span>
            {matchResult && <span className="text-green-600 ml-2">(genetic context loaded)</span>}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Context Status */}
      {!matchResult && (
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-700">
            <strong>Tip:</strong> Run the{' '}
            <Link to="/analysis" className="underline">
              genome analysis
            </Link>{' '}
            first to provide genetic context for more personalized AI responses.
          </p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto border rounded-lg bg-white p-4 mb-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">Start a conversation about your genetic analysis</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-gray-400">Example questions:</p>
              <SuggestedQuestion
                onClick={(q) => setMessage(q)}
                question="What does my CYP2D6 metabolizer status mean for medications?"
              />
              <SuggestedQuestion
                onClick={(q) => setMessage(q)}
                question="Can you explain my carrier status findings?"
              />
              <SuggestedQuestion
                onClick={(q) => setMessage(q)}
                question="What should I discuss with my doctor about these results?"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 text-gray-900">
                  <div className="whitespace-pre-wrap">{streamingContent}</div>
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
                </div>
              </div>
            )}
            {isLoading && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-3 bg-gray-100 text-gray-500">
                  <span className="flex items-center gap-2">
                    <LoadingDots />
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask about your genetic findings..."
          disabled={isLoading}
          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none disabled:bg-gray-50 sm:px-4 sm:py-3 sm:text-base"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !message.trim()}
          className="shrink-0 rounded-lg bg-primary-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:px-6 sm:py-3 sm:text-base"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      {/* Privacy Notice */}
      <p className="mt-2 text-[10px] text-gray-500 text-center sm:mt-4 sm:text-xs">
        Only summarized findings are sent to the AI provider. Raw genetic data (rsIDs, genotypes)
        never leave your device. Your conversation is not stored.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 ${
          isUser ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-2 ${isUser ? 'text-primary-200' : 'text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

function SuggestedQuestion({
  question,
  onClick
}: {
  question: string;
  onClick: (question: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(question)}
      className="block w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-600 text-sm transition-colors"
    >
      "{question}"
    </button>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </span>
  );
}

function getDefaultModel(provider: string): string {
  const models: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-pro',
    ollama: 'biomistral'
  };
  return models[provider] || 'gpt-4o';
}
