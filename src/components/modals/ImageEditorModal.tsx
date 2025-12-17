/**
 * ImageEditorModal.tsx
 * 
 * Full-screen image editor modal with model, aspect ratio, and resolution controls.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Banana, Image as ImageIcon, Crop, Monitor } from 'lucide-react';

// Image model configuration (same as NodeControls)
const IMAGE_MODELS = [
    { id: 'gemini-pro', name: 'Nano Banana Pro', provider: 'google', supportsImageToImage: true, supportsMultiImage: true, resolutions: ["1K", "2K", "4K"], aspectRatios: ["Auto", "1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "5:4", "4:5", "21:9"] },
    { id: 'kling-v1', name: 'Kling V1', provider: 'kling', supportsImageToImage: true, supportsMultiImage: false, resolutions: ["1K", "2K"], aspectRatios: ["Auto", "1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "21:9"] },
    { id: 'kling-v1-5', name: 'Kling V1.5', provider: 'kling', supportsImageToImage: true, supportsMultiImage: false, resolutions: ["1K", "2K"], aspectRatios: ["Auto", "1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "21:9"] },
    { id: 'kling-v2', name: 'Kling V2', provider: 'kling', supportsImageToImage: true, supportsMultiImage: true, resolutions: ["1K", "2K"], aspectRatios: ["Auto", "1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "21:9"] },
    { id: 'kling-v2-new', name: 'Kling V2 New', provider: 'kling', supportsImageToImage: true, supportsMultiImage: false, resolutions: ["1K", "2K"], aspectRatios: ["Auto", "1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "21:9"] },
    { id: 'kling-v2-1', name: 'Kling V2.1', provider: 'kling', supportsImageToImage: false, supportsMultiImage: true, recommended: true, resolutions: ["1K", "2K"], aspectRatios: ["Auto", "1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "21:9"] },
];

interface ImageEditorModalProps {
    isOpen: boolean;
    nodeId: string;
    imageUrl?: string;
    initialPrompt?: string;
    initialModel?: string;
    initialAspectRatio?: string;
    initialResolution?: string;
    onClose: () => void;
    onGenerate: (id: string, prompt: string, count: number) => void;
    onUpdate: (id: string, updates: any) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
    isOpen,
    nodeId,
    imageUrl,
    initialPrompt,
    initialModel,
    initialAspectRatio,
    initialResolution,
    onClose,
    onGenerate,
    onUpdate
}) => {
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [batchCount, setBatchCount] = useState(4);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showAspectDropdown, setShowAspectDropdown] = useState(false);
    const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);

    // Model state
    const [selectedModel, setSelectedModel] = useState(initialModel || 'gemini-pro');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState(initialAspectRatio || 'Auto');
    const [selectedResolution, setSelectedResolution] = useState(initialResolution || '1K');

    // Drawing mode state
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawingTool, setDrawingTool] = useState<'brush' | 'eraser'>('brush');
    const [brushWidth, setBrushWidth] = useState(4);
    const [eraserWidth, setEraserWidth] = useState(10);
    const [brushColor, setBrushColor] = useState('#ff0000');
    const [showToolSettings, setShowToolSettings] = useState(false);

    const modelDropdownRef = useRef<HTMLDivElement>(null);
    const aspectDropdownRef = useRef<HTMLDivElement>(null);
    const resolutionDropdownRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const currentModel = IMAGE_MODELS.find(m => m.id === selectedModel) || IMAGE_MODELS[0];

    // Reset state when modal opens with new data
    useEffect(() => {
        setPrompt(initialPrompt || '');
        setSelectedModel(initialModel || 'gemini-pro');
        setSelectedAspectRatio(initialAspectRatio || 'Auto');
        setSelectedResolution(initialResolution || '1K');
    }, [initialPrompt, initialModel, initialAspectRatio, initialResolution]);

    // Initialize canvas size when drawing mode is enabled
    useEffect(() => {
        if (isDrawingMode && imageRef.current && canvasRef.current) {
            const img = imageRef.current;
            const canvas = canvasRef.current;
            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;
        }
    }, [isDrawingMode]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setShowModelDropdown(false);
            }
            if (aspectDropdownRef.current && !aspectDropdownRef.current.contains(event.target as Node)) {
                setShowAspectDropdown(false);
            }
            if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(event.target as Node)) {
                setShowResolutionDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleGenerateClick = () => {
        // Save all settings to node before generating
        onUpdate(nodeId, {
            prompt,
            imageModel: selectedModel,
            aspectRatio: selectedAspectRatio,
            resolution: selectedResolution
        });
        onGenerate(nodeId, prompt, batchCount);
    };

    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
        const newModel = IMAGE_MODELS.find(m => m.id === modelId);

        // Reset aspect ratio if not supported
        if (newModel?.aspectRatios && !newModel.aspectRatios.includes(selectedAspectRatio)) {
            setSelectedAspectRatio('Auto');
        }

        // Update node
        onUpdate(nodeId, { imageModel: modelId });
        setShowModelDropdown(false);
    };

    const handleAspectChange = (ratio: string) => {
        setSelectedAspectRatio(ratio);
        onUpdate(nodeId, { aspectRatio: ratio });
        setShowAspectDropdown(false);
    };

    const handleResolutionChange = (res: string) => {
        setSelectedResolution(res);
        onUpdate(nodeId, { resolution: res });
        setShowResolutionDropdown(false);
    };

    // ============================================================================
    // DRAWING FUNCTIONS
    // ============================================================================

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingMode) return;
        isDrawingRef.current = true;
        const coords = getCanvasCoordinates(e);
        lastPointRef.current = coords;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const currentWidth = drawingTool === 'eraser' ? eraserWidth : brushWidth;

        ctx.beginPath();
        ctx.arc(coords.x, coords.y, currentWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = drawingTool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor;
        if (drawingTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.fill();
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingMode || !isDrawingRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !lastPointRef.current) return;

        const coords = getCanvasCoordinates(e);
        const currentWidth = drawingTool === 'eraser' ? eraserWidth : brushWidth;

        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = drawingTool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor;
        ctx.lineWidth = currentWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (drawingTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.stroke();
        lastPointRef.current = coords;
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
        lastPointRef.current = null;
    };

    // Preset colors for brush
    const presetColors = ['#ff0000', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6'];

    if (!isOpen) return null;

    // Filter models that support image-to-image (since we have an input image)
    const hasInputImage = !!imageUrl;
    const availableModels = hasInputImage
        ? IMAGE_MODELS.filter(m => m.supportsImageToImage)
        : IMAGE_MODELS;

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
            {/* Top Bar */}
            <div className="h-14 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-neutral-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                    <span className="text-sm text-neutral-300">Image Editor</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Download Button */}
                    <button
                        className="w-10 h-10 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
                        title="Download"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </button>
                    {/* Exit Button */}
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
                        title="Exit Image Editor"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Drawing Sub-Toolbar - Only visible when drawing mode is active */}
                {isDrawingMode && (
                    <div className="flex justify-center py-3 relative z-50">
                        <div className="bg-[#2a2a2a] bg-opacity-95 backdrop-blur-sm rounded-xl border border-neutral-600 px-2 py-1.5 flex items-center gap-1 shadow-2xl">
                            {/* Brush Button with Settings Panel */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setDrawingTool('brush');
                                        // Toggle settings if already brush, close if switching from eraser
                                        if (drawingTool === 'brush') {
                                            setShowToolSettings(!showToolSettings);
                                        } else {
                                            setShowToolSettings(true);
                                        }
                                    }}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${drawingTool === 'brush'
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-neutral-700 text-neutral-400'
                                        }`}
                                    title="Brush"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    </svg>
                                </button>

                                {/* Brush Settings Panel */}
                                {showToolSettings && drawingTool === 'brush' && (
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#2a2a2a] border border-neutral-600 rounded-xl p-4 shadow-2xl z-50 min-w-[200px]">
                                        {/* Brush Width */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-sm text-neutral-300 mb-2">
                                                <span>Brush Width</span>
                                                <span>{brushWidth}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={brushWidth}
                                                onChange={(e) => setBrushWidth(parseInt(e.target.value))}
                                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>

                                        {/* Preset Colors */}
                                        <div className="mb-3">
                                            <div className="text-sm text-neutral-300 mb-2">Preset Colors</div>
                                            <div className="flex gap-2">
                                                {presetColors.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setBrushColor(color)}
                                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${brushColor === color
                                                            ? 'border-white scale-110'
                                                            : 'border-transparent hover:border-neutral-500'
                                                            }`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom Color */}
                                        <div>
                                            <div className="text-sm text-neutral-300 mb-2">Custom Color</div>
                                            <input
                                                type="color"
                                                value={brushColor}
                                                onChange={(e) => setBrushColor(e.target.value)}
                                                className="w-full h-10 rounded-lg cursor-pointer border border-neutral-600"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Eraser Button with Settings Panel */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setDrawingTool('eraser');
                                        // Toggle settings if already eraser, close if switching from brush
                                        if (drawingTool === 'eraser') {
                                            setShowToolSettings(!showToolSettings);
                                        } else {
                                            setShowToolSettings(true);
                                        }
                                    }}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${drawingTool === 'eraser'
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-neutral-700 text-neutral-400'
                                        }`}
                                    title="Eraser"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                                        <path d="M22 21H7" />
                                        <path d="m5 11 9 9" />
                                    </svg>
                                </button>

                                {/* Eraser Settings Panel */}
                                {showToolSettings && drawingTool === 'eraser' && (
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#2a2a2a] border border-neutral-600 rounded-xl p-4 shadow-2xl z-50 min-w-[200px]">
                                        {/* Eraser Width */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm text-neutral-300 mb-2">
                                                <span>Eraser Width</span>
                                                <span>{eraserWidth}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                value={eraserWidth}
                                                onChange={(e) => setEraserWidth(parseInt(e.target.value))}
                                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="w-0"></div>

                {/* Canvas Area */}
                <div className="flex-1 flex items-center justify-center bg-black p-8">
                    {imageUrl ? (
                        <div ref={imageContainerRef} className="relative">
                            <img
                                ref={imageRef}
                                src={imageUrl}
                                alt="Editing"
                                className="max-w-full max-h-full object-contain"
                                onLoad={(e) => {
                                    // Set canvas size to match image
                                    const img = e.currentTarget;
                                    const canvas = canvasRef.current;
                                    if (canvas) {
                                        canvas.width = img.clientWidth;
                                        canvas.height = img.clientHeight;
                                    }
                                }}
                            />
                            {/* Drawing Canvas Overlay */}
                            {isDrawingMode && (
                                <canvas
                                    ref={canvasRef}
                                    className="absolute inset-0"
                                    style={{
                                        cursor: drawingTool === 'eraser'
                                            ? `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserWidth}" height="${eraserWidth}" viewBox="0 0 ${eraserWidth} ${eraserWidth}"><circle cx="${eraserWidth / 2}" cy="${eraserWidth / 2}" r="${eraserWidth / 2 - 1}" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="1"/></svg>') ${eraserWidth / 2} ${eraserWidth / 2}, auto`
                                            : 'crosshair'
                                    }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="w-[600px] h-[400px] bg-neutral-100 rounded flex items-center justify-center">
                            <span className="text-neutral-400">No image loaded</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Floating Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-6xl px-4 pointer-events-none">

                {/* Floating Tools Palette */}
                <div className="bg-[#2a2a2a] bg-opacity-95 backdrop-blur-sm rounded-xl border border-neutral-600 px-2 py-1.5 flex items-center gap-1 shadow-2xl pointer-events-auto">
                    {/* Drawing Mode (Pen) */}
                    <button
                        onClick={() => {
                            setIsDrawingMode(!isDrawingMode);
                            if (!isDrawingMode) {
                                setDrawingTool('brush');
                                setShowToolSettings(false);
                            }
                        }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDrawingMode
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-neutral-700 text-neutral-400'
                            }`}
                        title="Drawing Mode"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                    </button>

                    {/* Arrow Tool */}
                    <button
                        className="w-9 h-9 rounded-lg hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors"
                        title="Arrow"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Brush Tool */}
                    <button
                        className="w-9 h-9 rounded-lg hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors"
                        title="Brush"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
                            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
                            <path d="M14.5 17.5 4.5 15" />
                        </svg>
                    </button>

                    {/* Text Tool */}
                    <button
                        className="w-9 h-9 rounded-lg hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors"
                        title="Add Text"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7V4h16v3" />
                            <path d="M9 20h6" />
                            <path d="M12 4v16" />
                        </svg>
                    </button>

                    {/* Crop Tool */}
                    <button
                        className="w-9 h-9 rounded-lg hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors"
                        title="Crop"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2v4" />
                            <path d="M18 22v-4" />
                            <path d="M2 6h4" />
                            <path d="M22 18h-4" />
                            <rect x="6" y="6" width="12" height="12" />
                        </svg>
                    </button>

                    <div className="w-px h-6 bg-neutral-600 mx-1"></div>

                    {/* Undo */}
                    <button
                        className="w-9 h-9 rounded-lg hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors"
                        title="Undo"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                    </button>

                    {/* Redo */}
                    <button
                        className="w-9 h-9 rounded-lg hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors"
                        title="Redo"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 7v6h-6" />
                            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                        </svg>
                    </button>
                </div>

                {/* Prompt Bar - Single Row Layout */}
                <div className="w-full bg-[#2a2a2a] bg-opacity-95 backdrop-blur-sm rounded-xl border border-neutral-600 shadow-2xl pointer-events-auto flex items-center px-3 py-2.5 gap-3">
                    {/* Left - Model Dropdown */}
                    <div className="relative flex-shrink-0" ref={modelDropdownRef}>
                        <button
                            onClick={() => setShowModelDropdown(!showModelDropdown)}
                            className="flex items-center gap-1 text-[11px] text-neutral-300 hover:bg-neutral-700 px-2 py-1.5 rounded-md transition-colors border border-neutral-600"
                        >
                            {currentModel.provider === 'google' ? (
                                <Banana size={11} className="text-yellow-400" />
                            ) : (
                                <ImageIcon size={11} className="text-cyan-400" />
                            )}
                            <span className="font-medium whitespace-nowrap">{currentModel.name}</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>

                        {showModelDropdown && (
                            <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#252525] border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-[#1a1a1a] border-b border-neutral-700">
                                    {hasInputImage ? 'Image → Image' : 'Text → Image'}
                                </div>
                                {availableModels.filter(m => m.provider === 'google').length > 0 && (
                                    <>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-[#1f1f1f]">Google</div>
                                        {availableModels.filter(m => m.provider === 'google').map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => handleModelChange(model.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#333] transition-colors ${currentModel.id === model.id ? 'text-blue-400' : 'text-neutral-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Banana size={12} className="text-yellow-400" />
                                                    {model.name}
                                                </span>
                                                {currentModel.id === model.id && <Check size={12} />}
                                            </button>
                                        ))}
                                    </>
                                )}
                                {availableModels.filter(m => m.provider === 'kling').length > 0 && (
                                    <>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-[#1f1f1f] border-t border-neutral-700">Kling AI</div>
                                        {availableModels.filter(m => m.provider === 'kling').map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => handleModelChange(model.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#333] transition-colors ${currentModel.id === model.id ? 'text-blue-400' : 'text-neutral-300'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ImageIcon size={12} className="text-cyan-400" />
                                                    {model.name}
                                                    {(model as any).recommended && (
                                                        <span className="text-[9px] px-1 py-0.5 bg-green-600/30 text-green-400 rounded">REC</span>
                                                    )}
                                                </span>
                                                {currentModel.id === model.id && <Check size={12} />}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Prompt Input - Takes remaining space */}
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the changes you want to make..."
                        className="flex-1 min-w-0 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 outline-none"
                    />

                    {/* Right - Compact Controls Group */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Aspect Ratio */}
                        <div className="relative" ref={aspectDropdownRef}>
                            <button
                                onClick={() => setShowAspectDropdown(!showAspectDropdown)}
                                className="flex items-center gap-1 text-[11px] font-medium bg-neutral-700/50 hover:bg-neutral-600 border border-neutral-600 text-white px-2 py-1.5 rounded-md transition-colors"
                            >
                                <Crop size={10} className="text-blue-400" />
                                <span>{selectedAspectRatio}</span>
                            </button>

                            {showAspectDropdown && (
                                <div className="absolute bottom-full mb-2 right-0 w-28 bg-[#252525] border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                                    <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-[#1f1f1f]">Size</div>
                                    {(currentModel.aspectRatios || []).map(ratio => (
                                        <button
                                            key={ratio}
                                            onClick={() => handleAspectChange(ratio)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#333] transition-colors ${selectedAspectRatio === ratio ? 'text-blue-400' : 'text-neutral-300'}`}
                                        >
                                            <span>{ratio}</span>
                                            {selectedAspectRatio === ratio && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Resolution */}
                        <div className="relative" ref={resolutionDropdownRef}>
                            <button
                                onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
                                className="flex items-center gap-1 text-[11px] font-medium bg-neutral-700/50 hover:bg-neutral-600 border border-neutral-600 text-white px-2 py-1.5 rounded-md transition-colors"
                            >
                                <Monitor size={10} className="text-green-400" />
                                <span>{selectedResolution}</span>
                            </button>

                            {showResolutionDropdown && (
                                <div className="absolute bottom-full mb-2 right-0 w-24 bg-[#252525] border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50">
                                    <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-[#1f1f1f]">Resolution</div>
                                    {(currentModel.resolutions || ['1K']).map(res => (
                                        <button
                                            key={res}
                                            onClick={() => handleResolutionChange(res)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#333] transition-colors ${selectedResolution === res ? 'text-blue-400' : 'text-neutral-300'}`}
                                        >
                                            <span>{res}</span>
                                            {selectedResolution === res && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Batch Count */}
                        <div className="flex items-center bg-neutral-700/50 rounded-md px-2 py-1.5 gap-1 text-[11px] text-neutral-300 font-medium border border-neutral-600">
                            <button
                                className="hover:text-white disabled:opacity-50"
                                onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                                disabled={batchCount <= 1}
                            >‹</button>
                            <span className="w-3 text-center">{batchCount}</span>
                            <button
                                className="hover:text-white disabled:opacity-50"
                                onClick={() => setBatchCount(Math.min(4, batchCount + 1))}
                                disabled={batchCount >= 4}
                            >›</button>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerateClick}
                            className="px-4 py-1.5 bg-[#6c85ff] hover:bg-[#5a75ff] rounded-md text-[11px] font-bold text-white shadow-lg transition-all flex items-center gap-1.5 whitespace-nowrap"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 2v20M2 12h20" />
                            </svg>
                            Generate
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
