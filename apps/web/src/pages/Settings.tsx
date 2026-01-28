import { useState } from 'react';
import { useSettingsStore } from '../store/settings';
import type { AIProvider } from '@genomeforge/types';

const providers: { id: AIProvider; name: string; description: string; requiresKey: boolean }[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 and GPT-3.5 models',
    requiresKey: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 models',
    requiresKey: true
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models',
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
  const { aiProvider, setAiProvider, setApiKey } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedProvider = providers.find((p) => p.id === aiProvider);

  const handleSaveKey = () => {
    if (apiKeyInput && aiProvider) {
      setApiKey(aiProvider, apiKeyInput);
      setApiKeyInput('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

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
                className={`mt-1 h-4 w-4 rounded-full border-2 ${
                  aiProvider === provider.id
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-gray-300'
                }`}
              />
              <div>
                <div className="font-medium text-gray-900">{provider.name}</div>
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
            Your API key is encrypted and stored locally. It is never sent to our servers.
          </p>

          <div className="mt-4 flex gap-2">
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
              onClick={handleSaveKey}
              className="rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700"
            >
              Save
            </button>
          </div>

          {saved && <div className="mt-2 text-sm text-green-600">API key saved and encrypted!</div>}
        </div>
      )}

      {/* Ollama Setup */}
      {aiProvider === 'ollama' && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="font-semibold text-gray-900">Ollama Setup</h2>
          <p className="mt-2 text-sm text-gray-600">
            Run AI 100% offline on your computer with Ollama.
          </p>
          <ol className="mt-4 list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>
              Install Ollama from{' '}
              <a href="https://ollama.ai" className="text-primary-600 hover:underline">
                ollama.ai
              </a>
            </li>
            <li>
              Run: <code className="bg-gray-200 px-1 rounded">ollama pull biomistral</code>
            </li>
            <li>Start chatting - everything runs locally!</li>
          </ol>
          <p className="mt-4 text-xs text-gray-500">
            BioMistral-7B is recommended for genetic analysis (Apache 2.0 license).
          </p>
        </div>
      )}

      {/* Privacy Info */}
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="font-semibold text-green-800">Privacy Guarantee</h3>
        <ul className="mt-2 space-y-1 text-sm text-green-700">
          <li>API keys are encrypted with AES-256-GCM before storage</li>
          <li>Keys never leave your device (except to the AI provider you choose)</li>
          <li>Raw genetic data (rsIDs, genotypes) are never sent to AI</li>
          <li>Only summarized findings are used in AI conversations</li>
        </ul>
      </div>
    </div>
  );
}
