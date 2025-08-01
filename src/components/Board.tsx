import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from './Card';
import { Line, LineMarkers } from './Line';
import { FilterDock } from './FilterDock';
import { MiniMap } from './MiniMap';
import { useBoardController } from '@/hooks/useBoardController';
import type { Card as CardType, Line as LineType, BoardState } from '@/types';
import { cn } from '@/lib/utils';

interface BoardProps {
  cards: CardType[];
  lines: LineType[];
  className?: string;
  onCardSelect?: (cardId: string) => void;
  onCardDoubleClick?: (cardId: string) => void;
  controller?: any; // BoardController from parent
}

export function Board({ 
  cards, 
  lines, 
  className,
  onCardSelect,
  onCardDoubleClick,
  controller
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Use external controller if provided, otherwise create internal one
  const internalController = useBoardController({
    cards,
    lines,
    onStateChange: (state) => {
      localStorage.setItem('boardState', JSON.stringify({
        transform: state.transform,
      }));
    }
  });
  
  const boardController = controller || internalController;
  const state = boardController.getState();
  const { transform, selectedCard, pinnedCards, highlightedLines, expandedMeta, dimmedCards } = state;

  // Show all cards - no filtering
  const visibleCards = cards;

  // Handle mouse events for pan/zoom
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      boardController.setState({
        transform: {
          ...transform,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }
      });
    }
  }, [isDragging, dragStart, transform, boardController]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3.0, transform.scale * delta));
    
    // Zoom towards mouse position
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      boardController.setState({
        transform: {
          x: mouseX - (mouseX - transform.x) * (newScale / transform.scale),
          y: mouseY - (mouseY - transform.y) * (newScale / transform.scale),
          scale: newScale,
        }
      });
    }
  }, [transform, boardController]);

  // Initialize with overview on first load
  useEffect(() => {
    if (cards.length > 0 && !controller) {
      // Auto-overview on first load for standalone board
      boardController.overview(0.5);
    }
  }, [cards.length, boardController, controller]);

  // Render all cards - no frustum culling for simplicity
  const renderCards = visibleCards;

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-board-bg', className)}>
      {/* Main SVG Board */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <LineMarkers />
        
        <g 
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          style={{ transition: isDragging ? 'none' : 'transform var(--transition-board)' }}
        >
          {/* Render lines */}
          <g className="lines" style={{ zIndex: 'var(--z-lines)' }}>
            {lines.map(line => {
              const sourceCard = cards.find(c => c.id === line.source);
              const targetCard = cards.find(c => c.id === line.target);
              
              if (!sourceCard || !targetCard) return null;
              
              return (
                <Line
                  key={line.id}
                  line={line}
                  sourceCard={sourceCard}
                  targetCard={targetCard}
                  isHighlighted={highlightedLines.has(line.id)}
                  scale={transform.scale}
                />
              );
            })}
          </g>
        </g>
      </svg>

      {/* Cards rendered as HTML for better performance and interaction */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 'var(--z-cards)' }}
      >
        <div
          className="relative w-full h-full pointer-events-auto"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform var(--transition-board)',
          }}
        >
          {renderCards.map(card => (
            <Card
              key={card.id}
              card={card}
              scale={transform.scale}
              isSelected={selectedCard === card.id}
              isDimmed={dimmedCards.has(card.id)}
              isPinned={pinnedCards.has(card.id)}
              expandedFields={expandedMeta.get(card.id)}
              onSelect={onCardSelect}
              onDoubleClick={onCardDoubleClick}
            />
          ))}
        </div>
      </div>

    </div>
  );
}