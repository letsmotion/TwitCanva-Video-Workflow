/**
 * useGeneration.ts
 * 
 * Custom hook for handling AI content generation (images and videos).
 * Manages generation state, API calls, and error handling.
 */

import { NodeData, NodeType, NodeStatus } from '../types';
import { generateImage, generateVideo } from '../services/geminiService';
import { extractVideoLastFrame } from '../utils/videoHelpers';

interface UseGenerationProps {
    nodes: NodeData[];
    updateNode: (id: string, updates: Partial<NodeData>) => void;
}

export const useGeneration = ({ nodes, updateNode }: UseGenerationProps) => {
    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * Save generated asset to server for history
     */
    const saveAsset = async (type: 'images' | 'videos', data: string, prompt: string) => {
        try {
            await fetch(`http://localhost:3001/api/assets/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, prompt })
            });
        } catch (error) {
            console.error('Failed to save asset to history:', error);
        }
    };

    // ============================================================================
    // GENERATION HANDLER
    // ============================================================================

    /**
     * Handles content generation for a node
     * Supports image and video generation with parent node chaining
     * 
     * @param id - ID of the node to generate content for
     */
    const handleGenerate = async (id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node || !node.prompt) return;

        updateNode(id, { status: NodeStatus.LOADING });

        try {
            if (node.type === NodeType.IMAGE || node.type === NodeType.IMAGE_EDITOR) {
                // Collect ALL parent images for multi-input generation
                const imageBase64s: string[] = [];

                // Get images from all direct parents
                if (node.parentIds && node.parentIds.length > 0) {
                    for (const parentId of node.parentIds) {
                        let currentId: string | undefined = parentId;

                        // Traverse up the chain to find an image source
                        while (currentId && imageBase64s.length < 14) { // Gemini 3 Pro limit
                            const parent = nodes.find(n => n.id === currentId);
                            if (parent?.resultUrl) {
                                imageBase64s.push(parent.resultUrl);
                                break; // Found image for this parent chain
                            } else {
                                // Continue up this chain
                                currentId = parent?.parentIds?.[0];
                            }
                        }
                    }
                }

                // Generate image with all parent images
                const resultUrl = await generateImage({
                    prompt: node.prompt,
                    aspectRatio: node.aspectRatio,
                    resolution: node.resolution,
                    imageBase64: imageBase64s.length > 0 ? imageBase64s : undefined
                });
                updateNode(id, { status: NodeStatus.SUCCESS, resultUrl });

                // Save to history
                saveAsset('images', resultUrl, node.prompt);

            } else if (node.type === NodeType.VIDEO) {
                // Get first parent image for video generation
                let imageBase64: string | undefined;
                if (node.parentIds && node.parentIds.length > 0) {
                    const parent = nodes.find(n => n.id === node.parentIds![0]);

                    if (parent?.type === NodeType.VIDEO && parent.lastFrame) {
                        // Use last frame from parent video
                        imageBase64 = parent.lastFrame;
                    } else if (parent?.resultUrl) {
                        // Use parent image directly
                        imageBase64 = parent.resultUrl;
                    }
                }

                // Generate video
                const resultUrl = await generateVideo({
                    prompt: node.prompt,
                    imageBase64,
                    aspectRatio: node.aspectRatio,
                    resolution: node.resolution
                });

                // Extract last frame for chaining
                const lastFrame = await extractVideoLastFrame(resultUrl);

                updateNode(id, {
                    status: NodeStatus.SUCCESS,
                    resultUrl,
                    lastFrame
                });

                // Save to history
                saveAsset('videos', resultUrl, node.prompt);
            }
        } catch (error: any) {
            // Handle errors
            const msg = error.toString().toLowerCase();
            let errorMessage = error.message || 'Generation failed';

            if (msg.includes('permission_denied') || msg.includes('403')) {
                errorMessage = 'Permission denied. Check API Key configuration.';
            }

            updateNode(id, { status: NodeStatus.ERROR, errorMessage });
            console.error('Generation failed:', error);
        }
    };

    // ============================================================================
    // RETURN
    // ============================================================================

    return {
        handleGenerate
    };
};
