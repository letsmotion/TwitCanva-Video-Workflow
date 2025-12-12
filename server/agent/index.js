/**
 * agent/index.js
 * 
 * Main entry point for the LangGraph chat agent.
 * Exports the compiled graph and utility functions.
 * 
 * NOTE: Currently implemented in JavaScript/LangGraph.js for simplicity.
 * If more advanced agent capabilities are needed (complex tool chains,
 * multi-agent systems, advanced memory), consider migrating to Python
 * LangGraph which has a more mature and feature-rich ecosystem.
 */

import { createChatGraph, generateTopicTitle } from "./graph/chatGraph.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * In-memory session storage
 * Structure: { sessionId: { messages: [], topic: null, createdAt: Date } }
 * 
 * NOTE: For production, consider using a database or file-based storage.
 * LangGraph supports checkpointers (MemorySaver, MongoDB, etc.) for persistence.
 */
const sessions = new Map();

/**
 * Get or create a chat session
 * @param {string} sessionId - Unique session identifier
 * @returns {object} Session object
 */
export function getSession(sessionId) {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            messages: [],
            topic: null,
            createdAt: new Date(),
        });
    }
    return sessions.get(sessionId);
}

/**
 * Delete a chat session
 * @param {string} sessionId - Session to delete
 * @returns {boolean} Whether session existed and was deleted
 */
export function deleteSession(sessionId) {
    return sessions.delete(sessionId);
}

/**
 * List all sessions (for chat history)
 * @returns {Array} Array of session summaries
 */
export function listSessions() {
    const result = [];
    for (const [id, session] of sessions) {
        result.push({
            id,
            topic: session.topic || "New Chat",
            createdAt: session.createdAt,
            messageCount: session.messages.length,
        });
    }
    // Sort by most recent first
    return result.sort((a, b) => b.createdAt - a.createdAt);
}

// ============================================================================
// CHAT FUNCTIONS
// ============================================================================

/**
 * Send a message to the chat agent and get a response
 * @param {string} sessionId - Session identifier
 * @param {string} content - User message content
 * @param {object} media - Optional media attachment { type, url, base64 }
 * @param {string} apiKey - Google AI API key
 * @returns {Promise<object>} { response: string, topic?: string }
 */
export async function sendMessage(sessionId, content, media, apiKey) {
    const session = getSession(sessionId);
    const graph = createChatGraph();

    // Build the user message content
    let messageContent;
    if (media && media.base64) {
        // Multimodal message with image/video
        const mimeType = media.type === 'video' ? 'video/mp4' : 'image/png';
        // Extract base64 data if it's a data URL
        const base64Data = media.base64.includes(',')
            ? media.base64.split(',')[1]
            : media.base64;

        messageContent = [
            { type: "text", text: content || "What do you see in this image?" },
            {
                type: "image_url",
                image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                },
            },
        ];
    } else {
        messageContent = content;
    }

    // Add user message to session
    const userMessage = new HumanMessage(messageContent);
    session.messages.push(userMessage);

    // Invoke the graph
    const result = await graph.invoke(
        { messages: session.messages },
        { configurable: { apiKey } }
    );

    // Extract AI response from result
    const aiResponse = result.messages[result.messages.length - 1];
    session.messages.push(aiResponse);

    // Generate topic if this is the first exchange (2 messages: user + AI)
    let topic = session.topic;
    if (session.messages.length === 2 && !session.topic) {
        try {
            topic = await generateTopicTitle(session.messages, apiKey);
            session.topic = topic;
        } catch (err) {
            console.error("Failed to generate topic:", err);
            topic = "New Chat";
        }
    }

    return {
        response: aiResponse.content.toString(),
        topic: topic,
        messageCount: session.messages.length,
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { createChatGraph, generateTopicTitle };

export default {
    getSession,
    deleteSession,
    listSessions,
    sendMessage,
    createChatGraph,
    generateTopicTitle,
};
