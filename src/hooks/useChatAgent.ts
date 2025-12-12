/**
 * useChatAgent.ts
 * 
 * Custom hook for chat agent interactions.
 * Manages messages, sessions, topics, and API communication.
 */

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    media?: {
        type: 'image' | 'video';
        url: string;
    };
    timestamp: Date;
}

export interface ChatSession {
    id: string;
    topic: string;
    createdAt: Date;
    messageCount: number;
}

interface UseChatAgentReturn {
    messages: ChatMessage[];
    topic: string | null;
    sessionId: string | null;
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string, media?: { type: 'image' | 'video'; url: string; base64?: string }) => Promise<void>;
    startNewChat: () => void;
    hasMessages: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useChatAgent(): UseChatAgentReturn {
    // --- State ---
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [topic, setTopic] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use ref to track if we've initialized a session
    const hasInitializedRef = useRef(false);

    // --- Callbacks ---

    /**
     * Initialize a new session if needed
     */
    const ensureSession = useCallback(() => {
        if (!sessionId) {
            const newSessionId = generateSessionId();
            setSessionId(newSessionId);
            return newSessionId;
        }
        return sessionId;
    }, [sessionId]);

    /**
     * Send a message to the chat agent
     */
    const sendMessage = useCallback(async (
        content: string,
        media?: { type: 'image' | 'video'; url: string; base64?: string }
    ) => {
        const currentSessionId = ensureSession();
        setError(null);
        setIsLoading(true);

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'user',
            content,
            media: media ? { type: media.type, url: media.url } : undefined,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    message: content,
                    media: media ? {
                        type: media.type,
                        base64: media.base64 || media.url, // Use base64 if available, otherwise URL
                    } : undefined,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || response.statusText);
            }

            const data = await response.json();

            // Add AI response
            const aiMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMessage]);

            // Update topic if returned
            if (data.topic) {
                setTopic(data.topic);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            console.error('Chat error:', err);

            // Remove the user message on error (optional - could keep it and show retry)
            // setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        } finally {
            setIsLoading(false);
        }
    }, [ensureSession]);

    /**
     * Start a new chat session
     */
    const startNewChat = useCallback(() => {
        setMessages([]);
        setTopic(null);
        setSessionId(generateSessionId());
        setError(null);
        hasInitializedRef.current = false;
    }, []);

    return {
        messages,
        topic,
        sessionId,
        isLoading,
        error,
        sendMessage,
        startNewChat,
        hasMessages: messages.length > 0,
    };
}

export default useChatAgent;
