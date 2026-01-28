import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';
import { useSettingsStore } from '../store/settings';

export default function ChatPage() {
  const genome = useGenomeStore((state) => state.genome);
  const aiProvider = useSettingsStore((state) => state.aiProvider);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

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

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setMessage('');

    // TODO: Implement actual AI chat
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'AI chat functionality coming soon! This will connect to your configured AI provider.'
        }
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat with AI</h1>
          <p className="text-sm text-gray-600">
            Ask questions about your genetic findings. Using {aiProvider}.
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto border rounded-lg bg-white p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation about your genetic analysis.</p>
            <p className="mt-2 text-sm">
              Example: "What does my BRCA1 status mean?" or "Which medications should I be careful
              with?"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your genetic findings..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700"
        >
          Send
        </button>
      </div>

      {/* Privacy Notice */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Only summarized findings are sent to the AI provider. Raw genetic data (rsIDs, genotypes)
        never leave your device.
      </p>
    </div>
  );
}
