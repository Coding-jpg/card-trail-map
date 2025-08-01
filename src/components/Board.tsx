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
  isStoryMode?: boolean;
}

export function Board({ 
  cards, 
  lines, 
  className,
  onCardSelect,
  onCardDoubleClick,
  isStoryMode = false
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFilterDockOpen, setIsFilterDockOpen] = useState(false);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  
  const boardController = useBoardController({
    cards,
    lines,
    onStateChange: (state) => {
      // Could persist to localStorage here
      localStorage.setItem('boardState', JSON.stringify({
        transform: state.transform,
        filters: {
          ...state.filters,
          kinds: Array.from(state.filters.kinds),
          tags: Array.from(state.filters.tags),
        }
      }));
    }
  });

  const state = boardController.getState();
  const { transform, selectedCard, pinnedCards, highlightedLines, expandedMeta, dimmedCards, filters } = state;

  // Filter cards and lines based on current filters
  const filteredData = useMemo(() => {
    let filteredCards = cards.filter(card => {
      if (!filters.kinds.has(card.kind)) return false;
      if (filters.tags.size > 0 && !card.tags?.some(tag => filters.tags.has(tag))) return false;
      return true;
    });

    if (filters.onlyConnected && selectedCard) {
      const connectedIds = new Set([selectedCard]);
      lines.forEach(line => {
        if (line.source === selectedCard) connectedIds.add(line.target);
        if (line.target === selectedCard) connectedIds.add(line.source);
      });
      filteredCards = filteredCards.filter(card => connectedIds.has(card.id));
    }

    const filteredCardIds = new Set(filteredCards.map(c => c.id));
    const filteredLines = lines.filter(line => 
      filteredCardIds.has(line.source) && filteredCardIds.has(line.target)
    );

    return { cards: filteredCards, lines: filteredLines };
  }, [cards, lines, filters, selectedCard]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'Escape':
          boardController.setState({ selectedCard: undefined, highlightedLines: new Set() });
          break;
        case '0':
          boardController.overview();
          break;
        case 'f':
          setIsFilterDockOpen(prev => !prev);
          break;
        case 'm':
          setIsMiniMapVisible(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardController]);

  // Initialize board position
  useEffect(() => {
    const savedState = localStorage.getItem('boardState');
    if (savedState && !isStoryMode) {
      try {
        const parsed = JSON.parse(savedState);
        boardController.setState({
          transform: parsed.transform,
          filters: {
            ...parsed.filters,
            kinds: new Set(parsed.filters.kinds),
            tags: new Set(parsed.filters.tags),
          }
        });
      } catch (e) {
        // Ignore invalid saved state
      }
    } else if (cards.length > 0) {
      // Auto-overview on first load
      boardController.overview();
    }
  }, [cards.length, boardController, isStoryMode]);

  // Frustum culling for performance
  const visibleCards = useMemo(() => {
    if (typeof window === 'undefined') return filteredData.cards;
    
    const viewBounds = {
      left: -transform.x / transform.scale - 200,
      right: (-transform.x + window.innerWidth) / transform.scale + 200,
      top: -transform.y / transform.scale - 200,
      bottom: (-transform.y + window.innerHeight) / transform.scale + 200,
    };

    return filteredData.cards.filter(card => {
      if (!card.pos) return true;
      return card.pos.x >= viewBounds.left && 
             card.pos.x <= viewBounds.right &&
             card.pos.y >= viewBounds.top && 
             card.pos.y <= viewBounds.bottom;
    });
  }, [filteredData.cards, transform]);

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
          {/* Render lines first (behind cards) */}
          <g className="lines" style={{ zIndex: 'var(--z-lines)' }}>
            {filteredData.lines.map(line => {
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
          {visibleCards.map(card => (
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

      {/* UI Overlays */}
      {!isStoryMode && (
        <>
          {/* Filter Dock */}
          <FilterDock
            isOpen={isFilterDockOpen}
            onToggle={() => setIsFilterDockOpen(!isFilterDockOpen)}
            filters={filters}
            onFiltersChange={(newFilters) => boardController.setState({ filters: newFilters })}
            cards={cards}
          />

          {/* MiniMap */}
          {isMiniMapVisible && (
            <MiniMap
              cards={visibleCards}
              transform={transform}
              onTransformChange={(newTransform) => boardController.setState({ transform: newTransform })}
              className="absolute bottom-4 right-4"
            />
          )}

          {/* Keyboard shortcuts help */}
          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 text-xs text-muted-foreground">
            <div className="font-medium mb-2">Shortcuts</div>
            <div>0 - Overview</div>
            <div>F - Filters</div>
            <div>M - MiniMap</div>
            <div>ESC - Clear selection</div>
          </div>
        </>
      )}
    </div>
  );
}