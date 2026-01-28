import { useState, useCallback, useEffect } from 'react';
import { useSettingsStore } from '../store/settings';
import type { AIProvider } from '@genomeforge/types';

const providers: { id: AIProvider; name: string; description: string; requiresKey: boolean }[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o and GPT-4 Turbo models',
    requiresKey: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet model',
    requiresKey: true
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 1.5 Pro model',
    requiresKey: true
  },
  {
    id: 'ollama',
    name: 'Ollama (Offline)',
    description: '100% local AI using BioMistral',
    requiresKey: false
  }
];

export default function SettingsPage() {
  const { aiProvider, setAiProvider, setApiKey, hasApiKey, clearApiKey } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const selectedProvider = providers.find((p) => p.id === aiProvider);

  // Check Ollama connection status
  useEffect(() => {
    if (aiProvider === 'ollama') {
      checkOllamaConnection();
    }
  }, [aiProvider]);

  const checkOllamaConnection = useCallback(async () => {
    setOllamaStatus('checking');
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET'
      });
      if (response.ok) {
        setOllamaStatus('connected');
      } else {
        setOllamaStatus('disconnected');
      }
    } catch {
      setOllamaStatus('disconnected');
    }
  }, []);

  const validateAndSaveKey = useCallback(async () => {
    if (!apiKeyInput || !aiProvider) return;

    setValidating(true);
    setValidationError(null);

    try {
      // Basic format validation
      const keyPatterns: Record<string, RegExp> = {
        openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
        anthropic: /^sk-ant-[a-zA-Z0-9_-]{20,}$/,
        google: /^[a-zA-Z0-9_-]{20,}$/,
        ollama: /.*/ // No key needed
      };

      const pattern = keyPatterns[aiProvider];
      if (pattern && !pattern.test(apiKeyInput)) {
        setValidationError(`Invalid API key format for ${selectedProvider?.name}`);
        setValidating(false);
        return;
      }

      // Save to localStorage (in production, would use encrypted storage)
      const storageKey = `genomeforge_apikey_${aiProvider}`;
      localStorage.setItem(storageKey, apiKeyInput);

      // Update store to mark as configured
      await setApiKey(aiProvider, apiKeyInput);

      setApiKeyInput('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  }, [apiKeyInput, aiProvider, selectedProvider, setApiKey]);

  const removeApiKey = useCallback(() => {
    if (!aiProvider) return;

    const storageKey = `genomeforge_apikey_${aiProvider}`;
    localStorage.removeItem(storageKey);
    clearApiKey(aiProvider);
  }, [aiProvider, clearApiKey]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <p className="mt-2 text-gray-600">Configure your AI provider and API keys.</p>

      {/* AI Provider Selection */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">AI Provider</h2>
        <p className="mt-1 text-sm text-gray-600">
          Choose how you want to power the AI features. BYOK uses your own API keys.
        </p>

        <div className="mt-4 grid gap-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setAiProvider(provider.id)}
              className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-colors ${
                aiProvider === provider.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  aiProvider === provider.id
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-gray-300'
                }`}
              >
                {aiProvider === provider.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{provider.name}</div>
                  {hasApiKey[provider.id] && provider.requiresKey && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Configured
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{provider.description}</div>
                {!provider.requiresKey && (
                  <div className="mt-1 text-xs text-green-600">No API key required</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* API Key Input */}
      {selectedProvider?.requiresKey && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">API Key</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your API key is stored locally in your browser. It is never sent to our servers.
          </p>

          {hasApiKey[aiProvider!] ? (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {selectedProvider.name} API key configured
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Your key is securely stored in your browser
                  </p>
                </div>
                <button
                  onClick={removeApiKey}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your ${selectedProvider.name} API key`}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={validateAndSaveKey}
                  disabled={!apiKeyInput || validating}
                  className="rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {validating ? 'Validating...' : 'Save'}
                </button>
              </div>

              {validationError && (
                <p className="mt-2 text-sm text-red-600">{validationError}</p>
              )}

              {saved && (
                <p className="mt-2 text-sm text-green-600">API key saved successfully!</p>
              )}

              <p className="mt-3 text-xs text-gray-500">
                Get your API key from:{' '}
                {aiProvider === 'openai' && (
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    platform.openai.com
                  </a>
                )}
                {aiProvider === 'anthropic' && (
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    console.anthropic.com
                  </a>
                )}
                {aiProvider === 'google' && (
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    aistudio.google.com
                  </a>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ollama Setup */}
      {aiProvider === 'ollama' && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Ollama Setup</h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus === 'connected'
                    ? 'bg-green-500'
                    : ollamaStatus === 'checking'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-500">
                {ollamaStatus === 'connected'
                  ? 'Connected'
                  : ollamaStatus === 'checking'
                    ? 'Checking...'
                    : 'Not connected'}
              </span>
              <button
                onClick={checkOllamaConnection}
                className="text-xs text-primary-600 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Run AI 100% offline on your computer with Ollama.
          </p>
          <ol className="mt-4 list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>
              Install Ollama from{' '}
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                ollama.ai
              </a>
            </li>
            <li>
              Run:{' '}
              <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                ollama pull biomistral
              </code>
            </li>
            <li>Start chatting - everything runs locally!</li>
          </ol>
          <p className="mt-4 text-xs text-gray-500">
            BioMistral-7B is recommended for genetic analysis (Apache 2.0 license). Alternative
            models: llama3, mistral, mixtral
          </p>
        </div>
      )}

      {/* Data Management */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your locally stored data.</p>

        <div className="mt-4 space-y-3">
          <button
            onClick={() => {
              if (confirm('Clear all cached databases? You will need to reload them for analysis.')) {
                indexedDB.deleteDatabase('GenomeForgeDB');
                alert('Database cache cleared. Reload the page to continue.');
              }
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear Database Cache
          </button>

          <button
            onClick={() => {
              if (confirm('This will remove all your data including parsed genomes and settings. Continue?')) {
                localStorage.clear();
                indexedDB.deleteDatabase('GenomeForgeDB');
                window.location.reload();
              }
            }}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* Privacy Info */}
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="font-semibold text-green-800">Privacy Guarantee</h3>
        <ul className="mt-2 space-y-1 text-sm text-green-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            API keys are stored only in your browser's local storage
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Keys are sent directly to the AI provider - never through our servers
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Raw genetic data (rsIDs, genotypes) are never sent to AI providers
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Only summarized findings are used in AI conversations
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Use Ollama for 100% offline AI that never leaves your device
          </li>
        </ul>
      </div>
    </div>
  );
}
