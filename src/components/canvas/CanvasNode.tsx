/**
 * CanvasNode.tsx
 * 
 * Main canvas node component.
 * Orchestrates NodeContent, NodeControls, and NodeConnectors sub-components.
 */

import React from 'react';
import { NodeData, NodeStatus, NodeType } from '../../types';
import { NodeConnectors } from './NodeConnectors';
import { NodeContent } from './NodeContent';
import { NodeControls } from './NodeControls';

interface CanvasNodeProps {
  data: NodeData;
  inputUrl?: string;
  onUpdate: (id: string, updates: Partial<NodeData>) => void;
  onGenerate: (id: string) => void;
  onAddNext: (id: string, type: 'left' | 'right') => void;
  selected: boolean;
  onSelect: (id: string) => void;
  onNodePointerDown: (e: React.PointerEvent, id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onConnectorDown: (e: React.PointerEvent, id: string, side: 'left' | 'right') => void;
  isHoveredForConnection?: boolean;
}

export const CanvasNode: React.FC<CanvasNodeProps> = ({
  data,
  inputUrl,
  onUpdate,
  onGenerate,
  onAddNext,
  selected,
  onSelect,
  onNodePointerDown,
  onContextMenu,
  onConnectorDown,
  isHoveredForConnection
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(data.title || data.type);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const isIdle = data.status === NodeStatus.IDLE || data.status === NodeStatus.ERROR;
  const isLoading = data.status === NodeStatus.LOADING;
  const isSuccess = data.status === NodeStatus.SUCCESS;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Update local state when data.title changes
  React.useEffect(() => {
    setEditedTitle(data.title || data.type);
  }, [data.title, data.type]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getAspectRatioStyle = () => {
    if (data.type === NodeType.VIDEO) {
      return { aspectRatio: '16/9' };
    }

    const ratio = data.aspectRatio || 'Auto';
    if (ratio === 'Auto') return { aspectRatio: '1/1' };

    const [w, h] = ratio.split(':');
    return { aspectRatio: `${w}/${h}` };
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== data.type) {
      onUpdate(data.id, { title: trimmed });
    } else if (!trimmed) {
      setEditedTitle(data.title || data.type);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`absolute flex items-center group/node touch-none pointer-events-auto`}
      style={{
        transform: `translate(${data.x}px, ${data.y}px)`,
        transition: 'box-shadow 0.2s',
        zIndex: selected ? 50 : 10
      }}
      onPointerDown={(e) => onNodePointerDown(e, data.id)}
      onContextMenu={(e) => onContextMenu(e, data.id)}
    >
      <NodeConnectors nodeId={data.id} onConnectorDown={onConnectorDown} />

      {/* Main Node Card */}
      <div
        className={`relative w-[340px] rounded-2xl bg-[#0f0f0f] border transition-all duration-200 flex flex-col shadow-2xl ${selected ? 'border-blue-500/50 ring-1 ring-blue-500/30' : 'border-transparent'}`}
      >
        {/* Header (Editable Title) */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTitleSave();
              } else if (e.key === 'Escape') {
                setEditedTitle(data.title || data.type);
                setIsEditingTitle(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-7 left-0 text-xs px-2 py-0.5 rounded font-medium bg-blue-500/20 text-blue-200 outline-none border border-blue-400"
            style={{ minWidth: '60px' }}
          />
        ) : (
          <div
            className={`absolute -top-7 left-0 text-xs px-2 py-0.5 rounded font-medium transition-colors cursor-text ${selected ? 'bg-blue-500/20 text-blue-200' : 'text-neutral-600'}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            title="Double-click to edit"
          >
            {data.title || data.type}
          </div>
        )}

        {/* Content Area */}
        <NodeContent
          data={data}
          inputUrl={inputUrl}
          selected={selected}
          isIdle={isIdle}
          isLoading={isLoading}
          isSuccess={isSuccess}
          getAspectRatioStyle={getAspectRatioStyle}
        />

        {/* Control Panel - Only show if selected */}
        {selected && (
          <NodeControls
            data={data}
            inputUrl={inputUrl}
            isLoading={isLoading}
            isSuccess={isSuccess}
            onUpdate={onUpdate}
            onGenerate={onGenerate}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
};