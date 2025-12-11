import React from 'react';

interface ImageEditorModalProps {
    isOpen: boolean;
    nodeId: string;
    imageUrl?: string;
    onClose: () => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
    isOpen,
    nodeId,
    imageUrl,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
            {/* Top Bar */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-800">
                {/* Left - Logo/Title */}
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-blue-500"></div>
                    <span className="text-sm text-neutral-300">Image Editor</span>
                </div>

                {/* Right - Controls */}
                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button className="w-8 h-8 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-12 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-4 gap-2">
                    {/* Tool buttons */}
                    <button className="w-8 h-8 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                        </svg>
                    </button>
                    <button className="w-8 h-8 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                    </button>
                    <button className="w-8 h-8 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                    </button>
                    <button className="w-8 h-8 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 flex items-center justify-center bg-black p-8">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Editing" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <div className="w-[600px] h-[400px] bg-neutral-100 rounded flex items-center justify-center">
                            <span className="text-neutral-400">No image loaded</span>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (optional) */}
                <div className="w-64 bg-neutral-900 border-l border-neutral-800 p-4">
                    <div className="text-xs text-neutral-500 mb-2">Properties</div>
                    {/* Add properties panel here */}
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="h-16 border-t border-neutral-800 flex items-center justify-center px-4 gap-2">
                <button className="p-2 rounded hover:bg-neutral-800 text-neutral-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                </button>
                <button className="p-2 rounded hover:bg-neutral-800 text-neutral-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                </button>
                <button className="p-2 rounded hover:bg-neutral-800 text-neutral-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    </svg>
                </button>
                <button className="p-2 rounded hover:bg-neutral-800 text-neutral-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                </button>
                <button className="p-2 rounded hover:bg-neutral-800 text-neutral-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                    </svg>
                </button>
                <div className="flex-1"></div>
                <button className="p-2 rounded hover:bg-neutral-800 text-neutral-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                    </svg>
                </button>
            </div>

            {/* Prompt Input */}
            <div className="h-16 border-t border-neutral-800 px-4 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-neutral-900 rounded px-3 py-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-500">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Enter prompt for image generation..."
                        className="flex-1 bg-transparent text-sm text-neutral-300 placeholder-neutral-600 outline-none"
                    />
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors">
                    Generate
                </button>
            </div>
        </div>
    );
};
