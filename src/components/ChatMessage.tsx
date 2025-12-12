/**
 * ChatMessage.tsx
 * 
 * Reusable message bubble component for the chat panel.
 * Displays user and assistant messages with media support.
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    media?: {
        type: 'image' | 'video';
        url: string;
    };
    timestamp?: Date;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ChatMessage: React.FC<ChatMessageProps> = ({
    role,
    content,
    media,
    timestamp
}) => {
    const isUser = role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-cyan-600 text-white rounded-br-md'
                        : 'bg-neutral-800 text-neutral-100 rounded-bl-md'
                    }`}
            >
                {/* Media Attachment */}
                {media && (
                    <div className="mb-2">
                        {media.type === 'image' ? (
                            <img
                                src={media.url}
                                alt="Attached"
                                className="max-w-full max-h-48 rounded-lg object-cover"
                            />
                        ) : (
                            <video
                                src={media.url}
                                className="max-w-full max-h-48 rounded-lg object-cover"
                                controls
                            />
                        )}
                    </div>
                )}

                {/* Message Content */}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {content}
                </div>

                {/* Timestamp (optional) */}
                {timestamp && (
                    <div
                        className={`text-[10px] mt-1 ${isUser ? 'text-cyan-200' : 'text-neutral-500'
                            }`}
                    >
                        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
