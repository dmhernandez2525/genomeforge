import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI genetic assistant. I can help you understand your genetic data, explain variants, and answer questions about your analysis results. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSimulatedResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const getSimulatedResponse = (query: string): string => {
    const lowQuery = query.toLowerCase();

    if (lowQuery.includes('pathogenic') || lowQuery.includes('risk')) {
      return "Based on your genetic data, I found several variants of interest. Pathogenic variants are those that have been associated with increased disease risk. However, having a pathogenic variant doesn't guarantee you'll develop a condition - environmental factors and lifestyle also play important roles.";
    }

    if (lowQuery.includes('drug') || lowQuery.includes('medication')) {
      return "Your pharmacogenomic profile shows interesting variants that may affect how you metabolize certain medications. I recommend discussing any medication changes with your healthcare provider, who can use this information to personalize your treatment.";
    }

    if (lowQuery.includes('variant') || lowQuery.includes('snp')) {
      return "SNPs (Single Nucleotide Polymorphisms) are the most common type of genetic variation. Each variant may have different effects depending on where it's located in your genome and which genes it affects. Would you like me to explain a specific variant?";
    }

    return "That's a great question about your genetic data. Your genome contains millions of variants, and understanding their significance requires looking at them in context. Is there a specific aspect of your results you'd like me to focus on?";
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
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
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
          {suggestedQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => setInputText(question)}
            >
              <Text style={styles.suggestionText}>{question}</Text>
            </TouchableOpacity>
          ))}
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
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
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
          Conversations are processed with your configured AI provider
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    marginBottom: 8,
    alignSelf: 'flex-start',
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
});
