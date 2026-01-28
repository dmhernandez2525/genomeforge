import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '@/store/chat';
import { useAnalysisStore } from '@/store/analysis';
import {
  sendMessage,
  createUserMessage,
  createAssistantMessage,
  hasApiKey,
  storeApiKey,
  getAvailableModels,
  getDefaultModel,
  type AIProvider,
  type Message,
} from '@/services/aiChat';

export default function ChatScreen() {
  const {
    getCurrentSession,
    createSession,
    addMessage,
    provider,
    model,
    setProvider,
    setModel,
  } = useChatStore();
  const { analysisResult, genomeData } = useAnalysisStore();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentSession = getCurrentSession();
  const messages = currentSession?.messages || [];

  // Check for API key on mount
  useEffect(() => {
    checkApiKey();
  }, [provider]);

  // Create session if none exists
  useEffect(() => {
    if (!currentSession) {
      createSession();
    }
  }, [currentSession, createSession]);

  const checkApiKey = async () => {
    if (provider === 'ollama') {
      setHasKey(true);
      return;
    }
    const exists = await hasApiKey(provider);
    setHasKey(exists);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      await storeApiKey(provider, apiKeyInput.trim());
      setApiKeyInput('');
      setHasKey(true);
      setShowSettings(false);
      Alert.alert('Success', 'API key saved securely');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const getGenomeContext = useCallback((): string | undefined => {
    if (!analysisResult || !genomeData) return undefined;

    return `
User's genome data summary:
- Source: ${genomeData.source}
- Total variants: ${genomeData.variantCount?.toLocaleString()}
- Clinical matches: ${analysisResult.clinicalVariants}
- Pharmacogenomic matches: ${analysisResult.pharmacogenomicVariants}
- Trait associations: ${analysisResult.traitAssociations}
`.trim();
  }, [analysisResult, genomeData]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    if (!hasKey && provider !== 'ollama') {
      setShowSettings(true);
      return;
    }

    const userMessage = createUserMessage(inputText.trim());
    addMessage(userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessage(
        [...messages, userMessage],
        { provider, model },
        getGenomeContext()
      );

      const assistantMessage = createAssistantMessage(response.content);
      addMessage(assistantMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      Alert.alert('Error', errorMessage);

      // Add error message to chat
      const errorAssistantMessage = createAssistantMessage(
        "I apologize, but I encountered an error processing your request. Please check your API configuration and try again."
      );
      addMessage(errorAssistantMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {item.role === 'assistant' && (
        <View style={styles.assistantAvatar}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.messageContent,
          item.role === 'user' ? styles.userContent : styles.assistantContent,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.role === 'user' ? styles.userText : styles.assistantText,
          ]}
        >
          {item.content}
        </Text>
      </View>
    </View>
  );

  const suggestedQuestions = [
    'What pathogenic variants were found?',
    'Explain my drug metabolism',
    'Tell me about my health risks',
    'What does my analysis mean?',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>
            {provider.toUpperCase()} • {model.split('-')[0]}
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Ionicons name="settings-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={16} color="#fff" />
              </View>
              <View style={styles.loadingBubble}>
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => setInputText(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about your genetic data..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? '#fff' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyBar}>
        <Ionicons name="lock-closed" size={12} color="#6b7280" />
        <Text style={styles.privacyText}>
          {hasKey || provider === 'ollama'
            ? 'Using your API key • Data stays private'
            : 'Configure API key to start chatting'}
        </Text>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Provider Selection */}
            <Text style={styles.settingLabel}>AI Provider</Text>
            <View style={styles.providerOptions}>
              {(['openai', 'anthropic', 'ollama'] as AIProvider[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.providerOption,
                    provider === p && styles.providerOptionActive,
                  ]}
                  onPress={() => {
                    setProvider(p);
                    setModel(getDefaultModel(p));
                  }}
                >
                  <Text
                    style={[
                      styles.providerOptionText,
                      provider === p && styles.providerOptionTextActive,
                    ]}
                  >
                    {p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'Ollama'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Model Selection */}
            <Text style={styles.settingLabel}>Model</Text>
            <View style={styles.modelOptions}>
              {getAvailableModels(provider).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modelOption, model === m && styles.modelOptionActive]}
                  onPress={() => setModel(m)}
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      model === m && styles.modelOptionTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* API Key */}
            {provider !== 'ollama' && (
              <>
                <Text style={styles.settingLabel}>API Key</Text>
                <View style={styles.apiKeyContainer}>
                  <TextInput
                    style={styles.apiKeyInput}
                    value={apiKeyInput}
                    onChangeText={setApiKeyInput}
                    placeholder={hasKey ? '••••••••••••••••' : 'Enter your API key'}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.saveKeyButton} onPress={handleSaveApiKey}>
                    <Text style={styles.saveKeyButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.apiKeyHint}>
                  {hasKey
                    ? 'API key is stored securely. Enter a new key to replace it.'
                    : `Get your API key from ${provider === 'openai' ? 'platform.openai.com' : 'console.anthropic.com'}`}
                </Text>
              </>
            )}

            {provider === 'ollama' && (
              <View style={styles.ollamaInfo}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.ollamaInfoText}>
                  Ollama runs locally on your device. Make sure Ollama is running with a model
                  downloaded.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userContent: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#111827',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loadingBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  loadingText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  suggestionText: {
    color: '#2563eb',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  privacyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  privacyText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    padding: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  providerOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  providerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  providerOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  providerOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  providerOptionTextActive: {
    color: '#2563eb',
  },
  modelOptions: {
    gap: 8,
  },
  modelOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modelOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  modelOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modelOptionTextActive: {
    color: '#2563eb',
    fontWeight: '500',
  },
  apiKeyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  saveKeyButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveKeyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  apiKeyHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  ollamaInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  ollamaInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
